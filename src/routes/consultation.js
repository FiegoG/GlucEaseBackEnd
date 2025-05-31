// routes/consultation.js
const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const auth = require('../middleware/auth'); // middleware untuk autentikasi

// Ambil semua dokter
router.get('/doctors', auth, consultationController.getAllDoctors);

// Ambil detail dokter dan jadwal
router.get('/doctor/:id', auth, consultationController.getDoctorDetail);

// Validasi kupon
router.post('/validate-coupon', auth, consultationController.validateCoupon);

// Buat booking konsultasi
router.post('/book', auth, consultationController.createBooking);

// Ambil detail booking
router.get('/booking/:id', auth, consultationController.getBookingDetail);

module.exports = router;