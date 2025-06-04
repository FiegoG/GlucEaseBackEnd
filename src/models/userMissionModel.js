const db = require('../config/db');

const UserMission = {
  // Get user missions with progress
  getUserMissions: async (userId) => { // Tandai fungsi sebagai async
    console.log(`[${new Date().toISOString()}] INFO: Masuk ke UserMission.getUserMissions dengan userId: ${userId}`);
    const sql = `
      SELECT
        dm.*,
        umr.id as record_id,
        umr.progress,
        umr.status,
        umr.completed_at
      FROM daily_missions dm
      LEFT JOIN user_mission_records umr ON dm.id = umr.mission_id AND umr.user_id = ?
      WHERE dm.is_active = 1 AND DATE(dm.created_at) = CURDATE()
      ORDER BY dm.id ASC
    `;
    console.log(`[${new Date().toISOString()}] INFO: Menjalankan query SQL: ${sql.substring(0, 100)}...`);
    try {
      // Gunakan await untuk menunggu Promise dari pool.query() atau pool.execute()
      // pool.execute lebih aman terhadap SQL injection untuk prepared statements
      const [results] = await db.execute(sql, [userId]);
      console.log(`[${new Date().toISOString()}] INFO: Query SQL berhasil. Jumlah hasil: ${results ? results.length : 'null'}`);
      return results; // Kembalikan hasil langsung
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: Query SQL gagal di UserMission.getUserMissions:`, error);
      throw error; // Lemparkan error agar bisa ditangkap oleh controller
    }
  },

  // Start mission (create record)
  startMission: async (userId, missionId) => {
    console.log(`[${new Date().toISOString()}] INFO: Masuk ke UserMission.startMission, userId: ${userId}, missionId: ${missionId}`);
    const sql = `
      INSERT INTO user_mission_records (user_id, mission_id, status, progress)
      VALUES (?, ?, 'in_progress', 0)
      ON DUPLICATE KEY UPDATE
      status = VALUES(status), progress = VALUES(progress), updated_at = CURRENT_TIMESTAMP
    `; // Ditambahkan progress = VALUES(progress) untuk konsistensi jika dimulai ulang
    try {
      const [results] = await db.execute(sql, [userId, missionId]);
      console.log(`[${new Date().toISOString()}] INFO: UserMission.startMission berhasil.`);
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR di UserMission.startMission:`, error);
      throw error;
    }
  },

  // Update mission progress
  updateProgress: async (userId, missionId, progress) => {
    console.log(`[${new Date().toISOString()}] INFO: Masuk ke UserMission.updateProgress, userId: ${userId}, missionId: ${missionId}, progress: ${progress}`);
    const sql = `
      UPDATE user_mission_records
      SET progress = ?,
          updated_at = CURRENT_TIMESTAMP,
          status = CASE WHEN ? >= 100 THEN 'completed' ELSE 'in_progress' END,
          completed_at = CASE WHEN ? >= 100 THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE user_id = ? AND mission_id = ?
    `;
    try {
      // Parameter progress digunakan 3 kali dalam query
      const [results] = await db.execute(sql, [progress, progress, progress, userId, missionId]);
      console.log(`[${new Date().toISOString()}] INFO: UserMission.updateProgress berhasil.`);
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR di UserMission.updateProgress:`, error);
      throw error;
    }
  },

  // Get mission detail with user progress
 getMissionDetail: async (userId, missionId) => {
    console.log(`[${new Date().toISOString()}] INFO: Masuk ke UserMission.getMissionDetail, userId: ${userId}, missionId: ${missionId}`);
    const sql = `
      SELECT
        dm.*,
        umr.progress,
        umr.status,
        umr.completed_at
      FROM daily_missions dm
      LEFT JOIN user_mission_records umr ON dm.id = umr.mission_id AND umr.user_id = ?
      WHERE dm.id = ?
    `;
    try {
      const [results] = await db.execute(sql, [userId, missionId]);
      console.log(`[${new Date().toISOString()}] INFO: UserMission.getMissionDetail berhasil. Jumlah hasil: ${results ? results.length : 'null'}`);
      return results.length > 0 ? results[0] : null; // Kembalikan objek pertama atau null jika tidak ditemukan
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR di UserMission.getMissionDetail:`, error);
      throw error;
    }
  }
};

module.exports = UserMission;