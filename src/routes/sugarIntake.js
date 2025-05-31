//src/routes/sugarIntake.js
const express = require('express');
const router = express.Router();
const SugarTrackerController = require('../controllers/sugarIntakeController');

// Middleware untuk autentikasi
const authenticateToken = require('../middleware/auth');

// [HALAMAN UTAMA TRACKER] - Mendapatkan data tracker gula darah harian
router.get('/daily-tracker', authenticateToken, SugarTrackerController.getDailyTracker);

// [HALAMAN TAMBAH MAKANAN] - Mendapatkan daftar semua makanan yang tersedia
router.get('/foods', authenticateToken, SugarTrackerController.getFoodList);

// [HALAMAN DETAIL MAKANAN] - Mendapatkan detail lengkap makanan berdasarkan ID
router.get('/foods/:food_id', authenticateToken, SugarTrackerController.getFoodDetail);

// [DARI DETAIL MAKANAN] - Menambahkan makanan ke tracker harian
router.post('/add-food', authenticateToken, SugarTrackerController.addFoodToTracker);

// [DARI HALAMAN UTAMA] - Mengubah quantity makanan di tracker
router.put('/intake/:intake_id/quantity', authenticateToken, SugarTrackerController.updateFoodQuantity);

// [DARI HALAMAN UTAMA] - Menghapus makanan dari tracker
router.delete('/intake/:intake_id', authenticateToken, SugarTrackerController.removeFoodFromTracker);

module.exports = router;