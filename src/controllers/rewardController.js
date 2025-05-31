const Reward = require('../models/rewardModel');
const UserPoint = require('../models/userPointModel');

const rewardController = {
  // Get user points and available rewards
  getRewardsPage: async (req, res) => {
    try {
      const userId = req.user.id;

      const [userPoints, rewards] = await Promise.all([
        UserPoint.getUserPoints(userId),
        Reward.getAll()
      ]);

      res.json({
        success: true,
        data: {
          user_points: userPoints.total_points,
          rewards: rewards
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching rewards',
        error: error.message
      });
    }
  },

  // Claim reward
  claimReward: async (req, res) => {
    try {
      const userId = req.user.id;
      const rewardId = req.params.id;

      // Get reward details
      const reward = await Reward.getById(rewardId);
      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Reward not found'
        });
      }

      // Check if user has enough points
      const userPoints = await UserPoint.getUserPoints(userId);
      if (userPoints.total_points < reward.reward_value) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient points'
        });
      }

      // Deduct points and claim reward
      await UserPoint.deductPoints(userId, reward.reward_value, rewardId);
      await Reward.claimReward(userId, rewardId);

      res.json({
        success: true,
        message: 'Reward claimed successfully',
        points_spent: reward.reward_value
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error claiming reward',
        error: error.message
      });
    }
  }
};

module.exports = rewardController;