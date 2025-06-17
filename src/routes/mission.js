const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const auth = require('../middleware/auth'); // middleware untuk autentikasi

// GET /api/missions/ -> Mendapatkan daftar misi harian pengguna
router.get('/', auth, missionController.getUserMissions);

// GET /api/missions/:id -> Mendapatkan detail misi spesifik
router.get('/:id', auth, missionController.getMissionDetail);

// POST /api/missions/:id/claim -> Untuk mengklaim hadiah dari misi yang sudah selesai
// router.post('/:id/claim', auth, missionController.claimMissionReward);

// // Start mission (Memulai misi)
// // POST /api/missions/:id/start
// router.post('/:id/start', auth, missionController.startMission); // OK, POST karena mengubah state

// // Complete mission (Menyelesaikan misi)
// // POST /api/missions/:id/complete
// router.post('/:id/complete', auth, missionController.completeMission); // OK, POST karena mengubah state

module.exports = router;