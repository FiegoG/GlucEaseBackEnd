//src/controllers/bloodSugarController.js
const BloodSugarModel = require('../models/bloodSugarModel');
// const missionService = require('../services/missionService');

class BloodSugarController {
  // GET /api/blood-sugar/dashboard - Mendapatkan data untuk dashboard
  static async getDashboardData(req, res) {
    try {
      const userId = req.user.id; // Dari middleware auth
      
      // Ambil data 7 hari terakhir untuk grafik
      const weeklyRecords = await BloodSugarModel.getWeeklyRecords(userId);
      
      // Ambil 10 riwayat terakhir untuk tabel
      const recentHistory = await BloodSugarModel.getAllRecords(userId, 10, 0);
      
     // Format data untuk grafik (group by date)
      const chartData = weeklyRecords.reduce((acc, record) => {
        const checkDate = new Date(record.check_date); // pastikan ini objek Date
        const localDate = checkDate.getFullYear() + '-' +
                      String(checkDate.getMonth() + 1).padStart(2, '0') + '-' +
                      String(checkDate.getDate()).padStart(2, '0');
        if (!acc[localDate]) {
          acc[localDate] = [];
        }
        acc[localDate].push({
          level: record.blood_sugar_level,
          time: record.check_time
        });
        return acc;
      }, {});

      // Konversi ke format array untuk chart
      const formattedChartData = Object.keys(chartData).map(date => ({
        date,
        readings: chartData[date],
        averageLevel: chartData[date].reduce((sum, reading) => sum + reading.level, 0) / chartData[date].length
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        success: true,
        data: {
          chartData: formattedChartData,
          recentHistory: recentHistory,
          summary: {
            totalRecords: recentHistory.length,
            weeklyAverage: weeklyRecords.length > 0 
              ? weeklyRecords.reduce((sum, record) => sum + record.blood_sugar_level, 0) / weeklyRecords.length 
              : 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data dashboard',
        error: error.message
      });
    }
  }

  // GET /api/blood-sugar/history - Mendapatkan riwayat lengkap
  static async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const records = await BloodSugarModel.getAllRecords(userId, limit, offset);
      
      res.json({
        success: true,
        data: {
          records,
          pagination: {
            page,
            limit,
            hasMore: records.length === limit
          }
        }
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat data',
        error: error.message
      });
    }
  }

  // POST /api/blood-sugar/add - Menambah record baru
  static async addRecord(req, res) {
    try {
      const userId = req.user.id;
      const { bloodSugarLevel, checkDate, checkTime } = req.body;

      // Validasi input
      if (!bloodSugarLevel || !checkDate || !checkTime) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi (bloodSugarLevel, checkDate, checkTime)'
        });
      }

      // Validasi nilai gula darah
      if (bloodSugarLevel < 0 || bloodSugarLevel > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Nilai gula darah tidak valid'
        });
      }

      // Validasi format tanggal
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(checkDate)) {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal harus YYYY-MM-DD'
        });
      }

      // Validasi format waktu
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(checkTime)) {
        return res.status(400).json({
          success: false,
          message: 'Format waktu harus HH:MM'
        });
      }

      const recordId = await BloodSugarModel.createRecord(
        userId, 
        parseFloat(bloodSugarLevel), 
        checkDate, 
        checkTime
      );1

      // await missionService.handleEvent(userId, 'log_blood_sugar', 1);

      const newRecord = await BloodSugarModel.getRecordById(recordId, userId);

      res.status(201).json({
        success: true,
        message: 'Data gula darah berhasil ditambahkan',
        data: newRecord
      });
    } catch (error) {
      console.error('Error adding record:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan data gula darah',
        error: error.message
      });
    }
  }

  // PUT /api/blood-sugar/:id - Update record
  static async updateRecord(req, res) {
    try {
      const userId = req.user.id;
      const recordId = req.params.id;
      const { bloodSugarLevel, checkDate, checkTime } = req.body;

      // Validasi input sama seperti add
      if (!bloodSugarLevel || !checkDate || !checkTime) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi'
        });
      }

      const success = await BloodSugarModel.updateRecord(
        recordId, 
        userId, 
        parseFloat(bloodSugarLevel), 
        checkDate, 
        checkTime
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Data tidak ditemukan atau tidak dapat diupdate'
        });
      }

      const updatedRecord = await BloodSugarModel.getRecordById(recordId, userId);

      res.json({
        success: true,
        message: 'Data gula darah berhasil diupdate',
        data: updatedRecord
      });
    } catch (error) {
      console.error('Error updating record:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate data gula darah',
        error: error.message
      });
    }
  }

  // DELETE /api/blood-sugar/:id - Hapus record
  static async deleteRecord(req, res) {
    try {
      const userId = req.user.id;
      const recordId = req.params.id;

      const success = await BloodSugarModel.deleteRecord(recordId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Data tidak ditemukan atau tidak dapat dihapus'
        });
      }

      res.json({
        success: true,
        message: 'Data gula darah berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus data gula darah',
        error: error.message
      });
    }
  }
}

module.exports = BloodSugarController;