//src/models/UserPoint.js
const pool = require('../config/db'); // Assuming your src/db.js exports the mysql2/promise pool

const UserPoint = {
  getUserPoints: async (userId) => {
    console.log(`[${new Date().toISOString()}] INFO: UserPoint.getUserPoints - Fetching points for userId: ${userId}.`);
    const sql = `
      SELECT COALESCE(total_points, 0) as total_points
      FROM user_points
      WHERE user_id = ?
    `;
    try {
      const [results] = await pool.execute(sql, [userId]);
      const userPoints = results[0] || { total_points: 0 };
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.getUserPoints - Successfully fetched points for userId: ${userId}. Points: ${userPoints.total_points}.`);
      return userPoints;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: UserPoint.getUserPoints - Error fetching points for userId ${userId}:`, error);
      throw error;
    }
  },

  // Add points to user (manages its own transaction)
  addPoints: async (userId, points, sourceId) => {
    console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Adding ${points} points for userId: ${userId}, sourceId: ${sourceId}.`);
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Transaction started for userId: ${userId}.`);

      // 1. Update user_points table
      const updatePointsSql = `
        INSERT INTO user_points (user_id, total_points, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
        total_points = total_points + VALUES(total_points),
        updated_at = CURRENT_TIMESTAMP
      `;
      await connection.execute(updatePointsSql, [userId, points]);
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - User points updated for userId: ${userId}.`);

      // 2. Record transaction in point_transactions
      const transactionSql = `
        INSERT INTO point_transactions (user_id, type, points, source_id, created_at)
        VALUES (?, 'earned', ?, ?, CURRENT_TIMESTAMP)
      `;
      const [transactionResult] = await connection.execute(transactionSql, [userId, points, sourceId]);
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Point transaction recorded for userId: ${userId}.`);

      await connection.commit();
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Transaction committed for userId: ${userId}.`);
      return transactionResult; // Or some other meaningful success indicator
    } catch (error) {
      if (connection) {
        await connection.rollback();
        console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Transaction rolled back for userId: ${userId} due to error.`);
      }
      console.error(`[${new Date().toISOString()}] ERROR: UserPoint.addPoints - Error adding points for userId ${userId}:`, error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
        console.log(`[${new Date().toISOString()}] INFO: UserPoint.addPoints - Connection released for userId: ${userId}.`);
      }
    }
  },

  // Untuk mengurangi poin (DI DALAM transaksi yang dikelola controller)
  deductPointsInTransaction: async (userId, pointsToDeduct, rewardCatalogIdAsSource, connection) => {
    console.log(`[${new Date().toISOString()}] INFO: UserPoint.deductPointsInTransaction - Deducting ${pointsToDeduct} points for userId: ${userId}, source: ${rewardCatalogIdAsSource}.`);
    try {
      // 1. Kurangi poin pengguna
      const deductSql = `
        UPDATE user_points
        SET total_points = total_points - ?
        WHERE user_id = ? AND total_points >= ?`;
      const [deductResult] = await connection.execute(deductSql, [pointsToDeduct, userId, pointsToDeduct]);

      if (deductResult.affectedRows === 0) {
        console.warn(`[${new Date().toISOString()}] WARN: UserPoint.deductPointsInTransaction - Failed to deduct points or insufficient balance for userId: ${userId}.`);
        throw new Error('Gagal mengurangi poin atau saldo tidak mencukupi.');
      }
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.deductPointsInTransaction - Points deducted for userId: ${userId}.`);

      // 2. Catat transaksi poin
      const transactionSql = `
        INSERT INTO point_transactions (user_id, type, points, source_id, created_at)
        VALUES (?, 'spent', ?, ?, CURRENT_TIMESTAMP)
      `;
      await connection.execute(transactionSql, [userId, pointsToDeduct, rewardCatalogIdAsSource]);
      console.log(`[${new Date().toISOString()}] INFO: UserPoint.deductPointsInTransaction - Point transaction 'spent' recorded for userId: ${userId}.`);

      return { success: true };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: UserPoint.deductPointsInTransaction - Error deducting points for userId ${userId}:`, error);
      throw error; // Akan ditangkap oleh controller untuk rollback
    }
  }
};

module.exports = UserPoint;