const express = require('express');
const router = express.Router();
const BloodSugarController = require('../controllers/bloodSugarController');
const auth = require('../middleware/auth'); // Middleware autentikasi

// Semua routes membutuhkan autentikasi
router.use(auth);

// GET /api/blood-sugar/dashboard - Data untuk halaman utama
router.get('/dashboard', BloodSugarController.getDashboardData);

// GET /api/blood-sugar/history - Riwayat lengkap
router.get('/history', BloodSugarController.getHistory);

// POST /api/blood-sugar/add - Tambah record baru
router.post('/add', BloodSugarController.addRecord);

// PUT /api/blood-sugar/:id - Update record
router.put('/:id', BloodSugarController.updateRecord);

// DELETE /api/blood-sugar/:id - Hapus record
router.delete('/:id', BloodSugarController.deleteRecord);

module.exports = router;