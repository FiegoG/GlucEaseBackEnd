// src/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
// const authMiddleware = require('../middleware/auth'); // Jika Anda punya middleware autentikasi

// Rute untuk mendapatkan semua paket premium
router.get('/packages', subscriptionController.getPackages);

// Rute untuk user subscribe ke sebuah paket (payment bypassed)
// Untuk testing, userId bisa dikirim di body. Idealnya didapat dari authMiddleware
router.post('/subscribe', subscriptionController.subscribePackage); // Tambahkan authMiddleware jika sudah ada

// Rute untuk membatalkan langganan (untuk testing)
// Untuk testing, userId bisa dikirim di body. Idealnya didapat dari authMiddleware
router.post('/cancel', subscriptionController.cancelSubscription); // Tambahkan authMiddleware jika sudah ada

// Rute untuk mendapatkan status langganan user
router.get('/status/:userId', subscriptionController.getSubscriptionStatus); // Tambahkan authMiddleware jika sudah ada, dan ambil userId dari req.user

module.exports = router;