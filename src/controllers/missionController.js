const UserMission = require('../models/userMissionModel');
const DailyMission = require('../models/dailyMissionModel');
const UserPoint = require('../models/userPointModel');

const missionController = {
  // Get user missions (Sedang Dikerjakan & Belum Dikerjakan)
  getUserMissions: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(`[${new Date().toISOString()}] INFO: userId: ${userId}`);

      console.log(`[${new Date().toISOString()}] INFO: Memanggil UserMission.getUserMissions...`);
      // missionsFromDb akan berisi array misi dari daily_missions
      // yang sudah di-LEFT JOIN dengan user_mission_records
      const missionsFromDb = await UserMission.getUserMissions(userId);
      console.log(`[${new Date().toISOString()}] INFO: Selesai memanggil UserMission.getUserMissions. Jumlah misi: ${missionsFromDb ? missionsFromDb.length : 'null'}`);

      const allMissions = missionsFromDb.map(mission => {
        // 'mission' adalah objek gabungan dari daily_missions (dm.*)
        // dan user_mission_records (umr.* seperti record_id, progress, status)

        let currentProgress = 0;
        // Jika mission.record_id ada, berarti user sudah berinteraksi (memulai/menyelesaikan)
        if (mission.record_id != null) {
          if (mission.status === 'completed') {
            currentProgress = 100;
          } else if (mission.progress != null) { // Ambil progress dari record
            currentProgress = mission.progress;
          }
          // Jika status 'in_progress' tapi progress null (seharusnya tidak terjadi jika data konsisten),
          // maka currentProgress akan tetap 0, atau Anda bisa tambahkan logika khusus.
        }
        // Jika mission.record_id adalah null, berarti user belum memulai misi ini, progress = 0.

        return {
          // Sertakan semua field dari daily_missions yang dibutuhkan frontend
          id: mission.id,
          title: mission.title,
          description: mission.description,
          reward_type: mission.reward_type,
          reward_value: mission.reward_value,
          target_value: mission.target_value,
          mission_logic_type: mission.mission_logic_type,
          trigger_event_key: mission.trigger_event_key,
          point_reward: mission.point_reward,
          created_at: mission.created_at, // dan field lain dari dm.*
          // Tambahkan field progress yang akan digunakan untuk progress bar
          progress: currentProgress,
          // Anda mungkin masih ingin mengirim status mentah jika frontend perlu logika tambahan
          // misalnya untuk menampilkan ikon centang jika completed, dll.
          // Jika tidak, field ini bisa dihilangkan dari respons.
          status: mission.status // Akan null jika belum dimulai
        };
      });

      console.log(`[${new Date().toISOString()}] INFO: Selesai mapping misi. Jumlah allMissions: ${allMissions.length}`);

      console.log(`[${new Date().toISOString()}] INFO: Mengirim respons JSON...`);

      res.json({
        success: true,
        data: {
          missions: allMissions // Kirim sebagai satu array bernama 'missions'
        }
      });
      console.log(`[${new Date().toISOString()}] INFO: Respons JSON terkirim.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR di missionController.getUserMissions:`, error);
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

      const missionDetailFromDb = await UserMission.getMissionDetail(userId, missionId);

      if (!missionDetailFromDb) {
        return res.status(404).json({
          success: false,
          message: 'Mission not found'
        });
      }

      let currentProgress = 0;
      if (missionDetailFromDb.status === 'completed') {
          currentProgress = 100;
      } else if (missionDetailFromDb.progress != null) {
          currentProgress = missionDetailFromDb.progress;
      }
      // Jika belum dimulai (status dan progress dari umr akan null), currentProgress tetap 0.

      const missionData = {
          id: missionDetailFromDb.id,
          title: missionDetailFromDb.title,
          description: missionDetailFromDb.description,
          reward_type: missionDetailFromDb.reward_type,
          reward_value: missionDetailFromDb.reward_value,
          target_value: missionDetailFromDb.target_value,
          mission_logic_type: missionDetailFromDb.mission_logic_type,
          trigger_event_key: missionDetailFromDb.trigger_event_key,
          point_reward: missionDetailFromDb.point_reward,
          created_at: missionDetailFromDb.created_at,
          progress: currentProgress,
          status: missionDetailFromDb.status
      };

      res.json({
        success: true,
        data: missionData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching mission detail',
        error: error.message
      });
    }
  },

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

      // Update mission progress to 100% and status to 'completed'
      await UserMission.updateProgress(userId, missionId, 100);

      const mission = await DailyMission.getById(missionId); // DailyMission model
      let pointsEarned = 0;
      if (mission && mission.point_reward) {
        await UserPoint.addPoints(userId, mission.point_reward, `mission_complete_${missionId}`); // UserPoint model
        pointsEarned = mission.point_reward;
      }

      res.json({
        success: true,
        message: 'Mission completed successfully',
        points_earned: pointsEarned
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