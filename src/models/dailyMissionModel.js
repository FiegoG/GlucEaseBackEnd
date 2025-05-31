const db = require('../config/db');

const DailyMission = {
  // Get all daily missions
  getAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM daily_missions WHERE is_active = 1`;
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Get mission by ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM daily_missions WHERE id = ?`;
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Create new mission template
  create: (missionData) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO daily_missions SET ?`;
      db.query(sql, missionData, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
};

module.exports = DailyMission;