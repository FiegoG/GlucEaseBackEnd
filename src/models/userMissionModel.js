//src/models/userMissionModel.js
const db = require('../config/db');

const UserMission = {
    /**
     * Mengambil semua misi harian beserta progres pengguna untuk HARI INI.
     */
    getTodayUserMissions: async (userId) => {
        console.log(`[${new Date().toISOString()}] INFO: Mengambil misi hari ini untuk userId: ${userId}`);
        // Query ini memastikan kita hanya join dengan record misi yang dibuat hari ini.
        const sql = `
            SELECT
                dm.id,
                dm.title,
                dm.description,
                dm.reward_type,
                dm.reward_value,
                dm.target_value,
                dm.point_reward,
                COALESCE(umr.progress, 0) as progress,
                umr.status
            FROM daily_missions dm
            LEFT JOIN user_mission_records umr ON dm.id = umr.mission_id 
                AND umr.user_id = ? 
                AND DATE(umr.created_at) = CURDATE()
            WHERE dm.is_active = 1
            ORDER BY dm.id ASC
        `;
        try {
            const [results] = await db.execute(sql, [userId]);
            return results;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ERROR di UserMission.getTodayUserMissions:`, error);
            throw error;
        }
    },

    /**
     * Mengambil detail satu misi beserta progres pengguna untuk HARI INI.
     */
    getTodayMissionDetail: async (userId, missionId) => {
        console.log(`[${new Date().toISOString()}] INFO: Mengambil detail misi ${missionId} untuk userId: ${userId}`);
        const sql = `
            SELECT
                dm.id,
                dm.title,
                dm.description,
                dm.reward_type,
                dm.reward_value,
                dm.target_value,
                dm.point_reward,
                dm.trigger_event_key,
                dm.mission_logic_type,
                COALESCE(umr.progress, 0) as progress,
                umr.status
            FROM daily_missions dm
            LEFT JOIN user_mission_records umr ON dm.id = umr.mission_id 
                AND umr.user_id = ? 
                AND DATE(umr.created_at) = CURDATE()
            WHERE dm.is_active = 1 AND dm.id = ?
        `;
        try {
            const [results] = await db.execute(sql, [userId, missionId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ERROR di UserMission.getTodayMissionDetail:`, error);
            throw error;
        }
    }
};

module.exports = UserMission;