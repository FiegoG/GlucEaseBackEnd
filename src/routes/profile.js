// src/routes/profile.js
const express = require('express');
const { createProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth'); // Import middleware autentikasi

const router = express.Router();

// POST /profile (melindungi endpoint ini dengan middleware autentikasi)
router.post('/', authMiddleware, createProfile); // Endpoint ini sekarang memerlukan token login

module.exports = router;

