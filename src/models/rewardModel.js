const db = require('../config/db');

const Reward = {
  // Get all available rewards
  getAll: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM user_rewards 
        WHERE is_active = 1 
        ORDER BY reward_value ASC
      `;
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Get reward by ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM user_rewards WHERE id = ? AND is_active = 1`;
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Claim reward
  claimReward: (userId, rewardId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_reward_claims (user_id, reward_id, claimed_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;
      db.query(sql, [userId, rewardId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
};

module.exports = Reward;