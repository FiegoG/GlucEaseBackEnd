const db = require('../config/db');
const UserPoint = require('../models/userPointModel');

const missionService = {
    /**
     * Menangani event yang dapat memicu progres misi.
     * @param {number} userId - ID pengguna yang melakukan aksi.
     * @param {string} eventKey - Kunci event (e.g., 'log_food_item', 'log_blood_sugar').
     * @param {number} value - Nilai yang berhubungan dengan event (e.g., jumlah gula, atau 1 untuk event hitungan).
     */
    handleEvent: async (userId, eventKey, value = 1) => {
        console.log(`[${new Date().toISOString()}] SERVICE: Handling event '${eventKey}' for user ${userId} with value ${value}`);
        try {
            // 1. Cari semua misi yang 'in_progress' untuk hari ini yang cocok dengan eventKey
            const findMissionsSql = `
                SELECT 
                    umr.id as record_id, umr.progress,
                    dm.id as mission_id, dm.mission_logic_type, dm.target_value, dm.point_reward
                FROM user_mission_records umr
                JOIN daily_missions dm ON umr.mission_id = dm.id
                WHERE umr.user_id = ?
                  AND dm.trigger_event_key = ?
                  AND umr.status = 'in_progress'
                  AND DATE(umr.created_at) = CURDATE()
            `;
            const [activeMissions] = await db.execute(findMissionsSql, [userId, eventKey]);

            if (activeMissions.length === 0) {
                return; // Tidak ada misi aktif untuk event ini
            }

            for (const mission of activeMissions) {
                let newProgress = mission.progress;
                let isCompleted = false;

                // 2. Terapkan logika berdasarkan tipe misi
                switch (mission.mission_logic_type) {
                    case 'COUNT_UP':
                        newProgress += value; // Tambahkan progress (biasanya value = 1)
                        if (newProgress >= mission.target_value) {
                            isCompleted = true;
                            newProgress = mission.target_value; // Batasi progress agar tidak melebihi target
                        }
                        break;
                    
                    case 'STAY_BELOW_SUM':
                        // Untuk tipe ini, kita mengakumulasi nilai.
                        // Pengecekan final dilakukan oleh cron job di akhir hari.
                        newProgress += value;
                        break;
                }

                // 3. Update progres di database
                const updateProgressSql = "UPDATE user_mission_records SET progress = ? WHERE id = ?";
                await db.execute(updateProgressSql, [newProgress, mission.record_id]);

                // 4. Jika misi selesai (khusus untuk COUNT_UP), update status dan berikan poin
                if (isCompleted) {
                    const completeMissionSql = "UPDATE user_mission_records SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?";
                    await db.execute(completeMissionSql, [mission.record_id]);
                    
                    //await UserPoint.addPoints(userId, mission.point_reward, `mission_complete_${mission.mission_id}`);
                    console.log(`[${new Date().toISOString()}] SERVICE: Mission ${mission.mission_id} for user ${userId} is now complete and ready to be claimed.`);
                }
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] SERVICE ERROR: Failed to handle event '${eventKey}' for user ${userId}:`, error);
        }
    }
};

module.exports = missionService;

/**
 * CONTOH INTEGRASI:
 * Di dalam controller lain, misalnya saat menambahkan data gula darah.
 * * // Di dalam bloodSugarController.js
 * const missionService = require('../services/missionService');
 * * async function addBloodSugarRecord(req, res) {
 * try {
 * const userId = req.user.id;
 * // ... logika untuk menyimpan data gula darah ...
 * await BloodSugar.create(userId, req.body.value);
 * * // Panggil mission service untuk memproses event
 * await missionService.handleEvent(userId, 'log_blood_sugar', 1);
 * * res.status(201).json({ success: true, message: "Data berhasil disimpan." });
 * } catch (error) {
 * // ... handle error ...
 * }
 * }
 */