const db = require('../config/db');

const UserPoint = {
  // Get user total points
  getUserPoints: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COALESCE(total_points, 0) as total_points
        FROM user_points 
        WHERE user_id = ?
      `;
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { total_points: 0 });
      });
    });
  },

  // Add points to user
  addPoints: (userId, points, source) => {
    return new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);

        // Update user_points table
        const updatePointsSql = `
          INSERT INTO user_points (user_id, total_points) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE 
          total_points = total_points + VALUES(total_points),
          updated_at = CURRENT_TIMESTAMP
        `;

        db.query(updatePointsSql, [userId, points], (err, result) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          // Record transaction
          const transactionSql = `
            INSERT INTO point_transactions (user_id, type, points, source_id, created_at)
            VALUES (?, 'earned', ?, ?, CURRENT_TIMESTAMP)
          `;

          db.query(transactionSql, [userId, points, source], (err, result) => {
            if (err) {
              return db.rollback(() => reject(err));
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => reject(err));
              }
              resolve(result);
            });
          });
        });
      });
    });
  },

  // Deduct points (for rewards)
  deductPoints: (userId, points, rewardId) => {
    return new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);

        // Check if user has enough points
        const checkSql = `SELECT total_points FROM user_points WHERE user_id = ?`;
        
        db.query(checkSql, [userId], (err, results) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          const currentPoints = results[0]?.total_points || 0;
          if (currentPoints < points) {
            return db.rollback(() => reject(new Error('Insufficient points')));
          }

          // Deduct points
          const deductSql = `
            UPDATE user_points 
            SET total_points = total_points - ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `;

          db.query(deductSql, [points, userId], (err, result) => {
            if (err) {
              return db.rollback(() => reject(err));
            }

            // Record transaction
            const transactionSql = `
              INSERT INTO point_transactions (user_id, type, points, source_id, created_at)
              VALUES (?, 'spent', ?, ?, CURRENT_TIMESTAMP)
            `;

            db.query(transactionSql, [userId, points, rewardId], (err, result) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => reject(err));
                }
                resolve(result);
              });
            });
          });
        });
      });
    });
  }
};

module.exports = UserPoint;