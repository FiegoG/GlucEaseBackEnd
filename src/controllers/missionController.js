const UserMission = require('../models/userMissionModel');
const DailyMission = require('../models/dailyMissionModel');
const UserPoint = require('../models/userPointModel');

const missionController = {
  // Get user missions (Sedang Dikerjakan & Belum Dikerjakan)
  getUserMissions: async (req, res) => {
    try {
      const userId = req.user.id; // dari middleware auth
      const missions = await UserMission.getUserMissions(userId);

      // Group missions by category
      const sedangDikerjakan = missions.filter(m => m.category === 'sedang_dikerjakan');
      const belumDikerjakan = missions.filter(m => m.category === 'belum_dikerjakan');

      res.json({
        success: true,
        data: {
          sedang_dikerjakan: sedangDikerjakan,
          belum_dikerjakan: belumDikerjakan
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching missions',
        error: error.message
      });
    }
  },

  // Get mission detail
  getMissionDetail: async (req, res) => {
    try {
      const userId = req.user.id;
      const missionId = req.params.id;

      const mission = await UserMission.getMissionDetail(userId, missionId);
      
      if (!mission) {
        return res.status(404).json({
          success: false,
          message: 'Mission not found'
        });
      }

      res.json({
        success: true,
        data: mission
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching mission detail',
        error: error.message
      });
    }
  },

  // Start mission
  startMission: async (req, res) => {
    try {
      const userId = req.user.id;
      const missionId = req.params.id;

      await UserMission.startMission(userId, missionId);

      res.json({
        success: true,
        message: 'Mission started successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error starting mission',
        error: error.message
      });
    }
  },

  // Complete mission and award points
  completeMission: async (req, res) => {
    try {
      const userId = req.user.id;
      const missionId = req.params.id;

      // Update mission progress to 100%
      await UserMission.updateProgress(userId, missionId, 100);

      // Get mission details to award points
      const mission = await DailyMission.getById(missionId);
      if (mission && mission.point_reward) {
        await UserPoint.addPoints(userId, mission.point_reward, missionId);
      }

      res.json({
        success: true,
        message: 'Mission completed successfully',
        points_earned: mission.point_reward || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error completing mission',
        error: error.message
      });
    }
  }
};

module.exports = missionController;