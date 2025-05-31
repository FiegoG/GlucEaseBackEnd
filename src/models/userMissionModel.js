const db = require('../config/db');

const UserMission = {
  // Get user missions with progress
  getUserMissions: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          dm.*,
          umr.id as record_id,
          umr.progress,
          umr.status,
          umr.completed_at,
          CASE 
            WHEN umr.progress > 0 THEN 'sedang_dikerjakan'
            ELSE 'belum_dikerjakan'
          END as category
        FROM daily_missions dm
        LEFT JOIN user_mission_records umr ON dm.id = umr.mission_id AND umr.user_id = ?
        WHERE dm.is_active = 1 AND DATE(dm.created_at) = CURDATE()
        ORDER BY category, dm.id
      `;
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Start mission (create record)
  startMission: (userId, missionId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_mission_records (user_id, mission_id, status, progress)
        VALUES (?, ?, 'in_progress', 0)
        ON DUPLICATE KEY UPDATE
        status = VALUES(status), updated_at = CURRENT_TIMESTAMP
      `;
      db.query(sql, [userId, missionId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Update mission progress
  updateProgress: (userId, missionId, progress) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE user_mission_records 
        SET progress = ?, updated_at = CURRENT_TIMESTAMP,
            status = CASE WHEN progress >= 100 THEN 'completed' ELSE 'in_progress' END,
            completed_at = CASE WHEN progress >= 100 THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE user_id = ? AND mission_id = ?
      `;
      db.query(sql, [progress, userId, missionId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Get mission detail with user progress
  getMissionDetail: (userId, missionId) => {
    return new Promise((resolve, reject) => {
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
      db.query(sql, [userId, missionId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }
};

module.exports = UserMission;