// src/routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { createUser, findUserByEmail, verifyUser } = require('../models/user');
const { sendVerificationEmail } = require('../utils/mail');
const {
    login,
    refreshToken,
    logout,
    forgotPassword,
    verifyToken,
    resetPassword,
    register,
    verifyEmail,
    resendVerification
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); // Pastikan ini diimport

const router = express.Router();

// Authentication routes
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);

// Registration routes
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// --- Hapus rute personalize-profile dari sini ---
// router.post('/personalize-profile', authMiddleware, personalizeProfile); // Hapus baris ini
// --- Akhir perubahan ---

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-token', verifyToken);
router.post('/reset-password', resetPassword);

module.exports = router;
