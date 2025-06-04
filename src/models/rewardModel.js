// src/models/Reward.js
const pool = require('../config/db'); // Assuming your src/db.js exports the mysql2/promise pool

const Reward = {
  // Untuk menampilkan daftar reward yang tersedia
  getAll: async () => {
    console.log(`[${new Date().toISOString()}] INFO: Reward.getAll - Fetching all available rewards.`);
    const sql = `
      SELECT id, name, description, point_cost, reward_type, stock
      FROM rewards_catalog
      WHERE is_active_in_store = 1 AND stock > 0
      ORDER BY point_cost ASC
    `;
    try {
      const [results] = await pool.execute(sql);
      console.log(`[${new Date().toISOString()}] INFO: Reward.getAll - Successfully fetched ${results.length} rewards.`);
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: Reward.getAll - Error fetching rewards:`, error);
      throw error;
    }
  },

  // Untuk mendapatkan detail reward spesifik (DI DALAM transaksi)
  getByIdForClaim: async (rewardId, connection) => { // Menerima 'connection' untuk transaksi
    console.log(`[${new Date().toISOString()}] INFO: Reward.getByIdForClaim - Fetching reward (for claim) with id: ${rewardId}.`);
    const sql = `
      SELECT id, name, point_cost, stock, validity_days_after_claim, reward_type, linked_coupon_id
      FROM rewards_catalog
      WHERE id = ? AND is_active_in_store = 1
    `;
    try {
      // Gunakan 'connection.execute' untuk memastikan query berjalan dalam transaksi yang sama
      const [results] = await connection.execute(sql, [rewardId]);
      if (results.length === 0) {
        console.log(`[${new Date().toISOString()}] INFO: Reward.getByIdForClaim - No active reward found with id: ${rewardId}.`);
        return null;
      }
      console.log(`[${new Date().toISOString()}] INFO: Reward.getByIdForClaim - Successfully fetched reward with id: ${rewardId}.`);
      return results[0];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: Reward.getByIdForClaim - Error fetching reward with id ${rewardId}:`, error);
      throw error; // Akan ditangkap oleh controller untuk rollback
    }
  },

  // Untuk mencatat klaim dan mengurangi stok (DI DALAM transaksi)
  recordClaimInTransaction: async (userId, rewardDetails, connection) => {
    console.log(`[${new Date().toISOString()}] INFO: Reward.recordClaimInTransaction - Recording claim for userId: ${userId}, rewardId: ${rewardDetails.id}.`);
    try {
      // 1. Kurangi stok
      const decrementStockSql = `UPDATE rewards_catalog SET stock = stock - 1 WHERE id = ? AND stock > 0`;
      const [updateResult] = await connection.execute(decrementStockSql, [rewardDetails.id]);

      if (updateResult.affectedRows === 0) {
        console.warn(`[${new Date().toISOString()}] WARN: Reward.recordClaimInTransaction - Failed to decrement stock or stock was already 0 for rewardId: ${rewardDetails.id}.`);
        throw new Error('Gagal mengurangi stok atau stok habis.'); // Melempar error agar transaksi di-rollback
      }
      console.log(`[${new Date().toISOString()}] INFO: Reward.recordClaimInTransaction - Stock decremented for rewardId: ${rewardDetails.id}.`);

      // 2. Hitung tanggal kedaluwarsa untuk reward yang diklaim
      let instanceExpiredAt = null;
      if (rewardDetails.validity_days_after_claim && rewardDetails.validity_days_after_claim > 0) {
        const claimedAtDate = new Date();
        instanceExpiredAt = new Date(claimedAtDate.setDate(claimedAtDate.getDate() + rewardDetails.validity_days_after_claim));
      }

      // 3. Masukkan ke tabel user_claimed_rewards
      const insertClaimSql = `
        INSERT INTO user_claimed_rewards
          (user_id, reward_catalog_id, points_spent, status, claimed_at, instance_expired_at, claimed_coupon_instance_id)
        VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, ?, NULL)
      `;
      await connection.execute(insertClaimSql, [
        userId,
        rewardDetails.id,
        rewardDetails.point_cost,
        instanceExpiredAt
      ]);
      console.log(`[${new Date().toISOString()}] INFO: Reward.recordClaimInTransaction - Claim recorded for userId: ${userId}, rewardId: ${rewardDetails.id}.`);

      return { success: true }; // Tidak perlu resolve() lagi
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: Reward.recordClaimInTransaction - Error recording claim for userId ${userId}, rewardId ${rewardDetails.id}:`, error);
      throw error; // Akan ditangkap oleh controller untuk rollback
    }
  }
};

module.exports = Reward;