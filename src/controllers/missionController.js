//src/controllers/missionController.js
const UserMission = require('../models/userMissionModel');

const missionController = {
    /**
     * Mendapatkan daftar misi pengguna untuk hari ini.
     * Frontend akan menerima progress dan target_value untuk menampilkan progress bar.
     */
    getUserMissions: async (req, res) => {
        try {
            const userId = req.user.id;
            const missionsFromDb = await UserMission.getTodayUserMissions(userId);

            const allMissions = missionsFromDb.map(mission => {
                return {
                    id: mission.id,
                    title: mission.title,
                    // Frontend dapat membuat progress bar dari progress / target_value
                    progress: mission.progress,
                    target_value: mission.target_value,
                    point_reward: mission.point_reward,
                    // Status akan 'in_progress', 'completed', 'failed', atau null jika record belum ada
                    status: mission.status 
                };
            });

            res.json({
                success: true,
                data: {
                    missions: allMissions
                }
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ERROR di missionController.getUserMissions:`, error);
            res.status(500).json({ success: false, message: 'Error fetching missions', error: error.message });
        }
    },

    /**
     * Mendapatkan detail misi, sesuai dengan desain UI.
     */
    getMissionDetail: async (req, res) => {
        try {
            const userId = req.user.id;
            const missionId = req.params.id;
            const missionDetail = await UserMission.getTodayMissionDetail(userId, missionId);

            if (!missionDetail) {
                return res.status(404).json({ success: false, message: 'Mission not found' });
            }

            // Durasi aktif ditentukan hingga akhir hari
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const missionData = {
                id: missionDetail.id,
                title: missionDetail.title,
                description: missionDetail.description,
                active_duration: `Tersedia hingga pukul ${endOfDay.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} hari ini`,
                progress: missionDetail.progress,
                target_value: missionDetail.target_value,
                point_reward: missionDetail.point_reward,
                status: missionDetail.status
            };

            res.json({
                success: true,
                data: missionData
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ERROR di missionController.getMissionDetail:`, error);
            res.status(500).json({ success: false, message: 'Error fetching mission detail', error: error.message });
        }
    }
};

module.exports = missionController;