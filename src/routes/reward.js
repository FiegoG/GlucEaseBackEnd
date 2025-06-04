const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const auth = require('../middleware/auth');

// Get rewards page data (Mendapatkan data untuk halaman reward: poin pengguna & daftar reward)
// GET /api/rewards/
router.get('/', auth, rewardController.getRewardsPage); // OK

// Claim reward (Mengklaim reward)
// POST /api/rewards/:id/claim
router.post('/:id/claim', auth, rewardController.claimReward); // OK, POST karena ini adalah tindakan yang mengubah state

module.exports = router;