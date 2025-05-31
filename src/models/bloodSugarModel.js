//src/models/bloodSugarModel.js
const db = require('../config/db');

class BloodSugarModel {
  // Mendapatkan semua record gula darah user dalam 7 hari terakhir
  static async getWeeklyRecords(userId) {
    const query = `
      SELECT 
        id,
        blood_sugar_level,
        check_date,
        check_time,
        created_at,
        updated_at
      FROM blood_sugar_records 
      WHERE user_id = ? 
        AND check_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY check_date DESC, check_time DESC
    `;
    
    try {
      const [rows] = await db.execute(query, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan semua riwayat record gula darah user
  static async getAllRecords(userId, limit = 20, offset = 0) {
    const query = `
      SELECT 
        id,
        blood_sugar_level,
        check_date,
        check_time,
        created_at,
        updated_at
      FROM blood_sugar_records 
      WHERE user_id = ? 
      ORDER BY check_date DESC, check_time DESC
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await db.execute(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Menambah record gula darah baru
  static async createRecord(userId, bloodSugarLevel, checkDate, checkTime) {
    const query = `
      INSERT INTO blood_sugar_records 
      (user_id, blood_sugar_level, check_date, check_time, created_at, updated_at) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    try {
      const [result] = await db.execute(query, [userId, bloodSugarLevel, checkDate, checkTime]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan record berdasarkan ID
  static async getRecordById(id, userId) {
    const query = `
      SELECT 
        id,
        blood_sugar_level,
        check_date,
        check_time,
        created_at,
        updated_at
      FROM blood_sugar_records 
      WHERE id = ? AND user_id = ?
    `;
    
    try {
      const [rows] = await db.execute(query, [id, userId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update record gula darah
  static async updateRecord(id, userId, bloodSugarLevel, checkDate, checkTime) {
    const query = `
      UPDATE blood_sugar_records 
      SET blood_sugar_level = ?, check_date = ?, check_time = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    
    try {
      const [result] = await db.execute(query, [bloodSugarLevel, checkDate, checkTime, id, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Hapus record gula darah
  static async deleteRecord(id, userId) {
    const query = `
      DELETE FROM blood_sugar_records 
      WHERE id = ? AND user_id = ?
    `;
    
    try {
      const [result] = await db.execute(query, [id, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BloodSugarModel;