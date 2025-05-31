const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const auth = require('../middleware/auth'); // middleware untuk autentikasi

// Get user missions
router.get('/', auth, missionController.getUserMissions);

// Get mission detail
router.get('/:id', auth, missionController.getMissionDetail);

// Start mission
router.post('/:id/start', auth, missionController.startMission);

// Complete mission
router.post('/:id/complete', auth, missionController.completeMission);

module.exports = router;