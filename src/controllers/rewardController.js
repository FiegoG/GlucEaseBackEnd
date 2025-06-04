// controllers/rewardController.js
const Reward = require('../models/rewardModel');
const UserPoint = require('../models/userPointModel');
const db = require('../config/db'); // Untuk mendapatkan fungsi transaksi dari konfigurasi DB Anda

const rewardController = {
  getRewardsPage: async (req, res) => {
    try {
      const userId = req.user.id;
      const [userPointsData, rewardsData] = await Promise.all([
        UserPoint.getUserPoints(userId),
        Reward.getAll() // Model Reward.getAll sudah disesuaikan
      ]);
      res.json({
        success: true,
        data: {
          user_points: userPointsData.total_points || 0,
          rewards: rewardsData
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching rewards page data',
        error: error.message
      });
    }
  },

  claimReward: async (req, res) => {
    const userId = req.user.id;
    const rewardCatalogId = req.params.id; // Ini adalah ID dari rewards_catalog
    let connection;

    try {
      // Dapatkan koneksi dari pool untuk transaksi
      // Cara mendapatkan koneksi dan memulai transaksi tergantung library DB Anda
      // Contoh untuk mysql2/promise:
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Dapatkan detail reward & cek stok (dalam transaksi)
      const rewardDetails = await Reward.getByIdForClaim(rewardCatalogId, connection);

      if (!rewardDetails) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Reward tidak ditemukan atau tidak aktif.' });
      }

      if (rewardDetails.stock <= 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Reward habis.' });
      }

      // 2. Cek apakah poin pengguna mencukupi
      const userPointsData = await UserPoint.getUserPoints(userId); // Bisa dipanggil tanpa transaksi, atau lewat connection
      // Gunakan rewardDetails.point_cost sesuai skema DB
      if (!userPointsData || userPointsData.total_points < rewardDetails.point_cost) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Poin tidak mencukupi.' });
      }

      // 3. Kurangi poin pengguna (dalam transaksi)
      await UserPoint.deductPointsInTransaction(userId, rewardDetails.point_cost, rewardCatalogId, connection);

      // 4. Catat klaim reward & kurangi stok (dalam transaksi)
      await Reward.recordClaimInTransaction(userId, rewardDetails, connection);

      // 5. Jika semua berhasil, commit transaksi
      await connection.commit();

      res.json({
        success: true,
        message: 'Reward berhasil diklaim!',
        points_spent: rewardDetails.point_cost // Kirim kembali poin yang dikeluarkan
      });

    } catch (error) {
      if (connection) {
        await connection.rollback(); // Rollback jika ada error
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat klaim reward.',
        // error: error.toString() // Untuk debugging jika perlu
      });
    } finally {
      if (connection) {
        connection.release(); // Selalu lepaskan koneksi kembali ke pool
      }
    }
  }
};

module.exports = rewardController;