const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const auth = require('../middleware/auth');

// Get rewards page data
router.get('/', auth, rewardController.getRewardsPage);

// Claim reward
router.post('/:id/claim', auth, rewardController.claimReward);

module.exports = router;