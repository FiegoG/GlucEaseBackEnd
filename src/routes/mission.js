const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const auth = require('../middleware/auth'); // middleware untuk autentikasi

// Get user missions (Mendapatkan daftar misi pengguna)
// GET /api/missions/
router.get('/', auth, missionController.getUserMissions); // OK

// Get mission detail (Mendapatkan detail misi spesifik)
// GET /api/missions/:id
router.get('/:id', auth, missionController.getMissionDetail); // OK

// Start mission (Memulai misi)
// POST /api/missions/:id/start
router.post('/:id/start', auth, missionController.startMission); // OK, POST karena mengubah state

// Complete mission (Menyelesaikan misi)
// POST /api/missions/:id/complete
router.post('/:id/complete', auth, missionController.completeMission); // OK, POST karena mengubah state

module.exports = router;