const cron = require('node-cron');
const db = require('../config/db');
const UserPoint = require('../models/userPointModel');

const scheduler = {
    /**
     * Menjalankan tugas untuk mereset misi harian bagi semua pengguna.
     * Dijalankan setiap hari pukul 00:00:01.
     */
    initDailyMissionReset: () => {
        cron.schedule('1 0 0 * * *', async () => {
            console.log(`[${new Date().toISOString()}] CRON: Memulai reset misi harian...`);
            try {
                const connection = await db.getConnection();
                
                // 1. Dapatkan semua user ID dengan role 'user'
                const [users] = await connection.execute("SELECT id FROM users WHERE role = 'user'");
                if (users.length === 0) {
                    console.log(`[${new Date().toISOString()}] CRON: Tidak ada pengguna yang ditemukan untuk reset misi.`);
                    connection.release();
                    return;
                }
                const userIds = users.map(u => u.id);

                // 2. Dapatkan semua misi harian yang aktif
                const [activeMissions] = await connection.execute("SELECT id FROM daily_missions WHERE is_active = 1");
                if (activeMissions.length === 0) {
                    console.log(`[${new Date().toISOString()}] CRON: Tidak ada misi aktif yang ditemukan.`);
                    connection.release();
                    return;
                }

                // 3. Buat record baru di user_mission_records untuk setiap user dan misi
                let recordsToInsert = [];
                for (const userId of userIds) {
                    for (const mission of activeMissions) {
                        recordsToInsert.push([userId, mission.id, 'in_progress', 0]);
                    }
                }

                if (recordsToInsert.length > 0) {
                    const sql = `
                        INSERT INTO user_mission_records (user_id, mission_id, status, progress) 
                        VALUES ?
                        ON DUPLICATE KEY UPDATE status='in_progress', progress=0, updated_at=CURRENT_TIMESTAMP;
                    `;
                    // Menggunakan ON DUPLICATE KEY UPDATE untuk keamanan jika cron berjalan lebih dari sekali
                    await connection.query(sql, [recordsToInsert]);
                }
                
                connection.release();
                console.log(`[${new Date().toISOString()}] CRON: Reset misi harian selesai. ${recordsToInsert.length} records dibuat/diupdate.`);

            } catch (error) {
                console.error(`[${new Date().toISOString()}] CRON ERROR: Gagal saat reset misi harian:`, error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });
    },

    /**
     * Menjalankan evaluasi untuk misi yang harus diperiksa di akhir hari.
     * Dijalankan setiap hari pukul 23:59:00.
     */
    initEndOfDayMissionEvaluation: () => {
        cron.schedule('0 59 23 * * *', async () => {
            console.log(`[${new Date().toISOString()}] CRON: Memulai evaluasi misi akhir hari...`);
            try {
                // Cari semua misi 'STAY_BELOW_SUM' yang masih 'in_progress' untuk hari ini
                const sql = `
                    SELECT 
                        umr.id, umr.user_id, umr.mission_id, umr.progress,
                        dm.target_value, dm.point_reward
                    FROM user_mission_records umr
                    JOIN daily_missions dm ON umr.mission_id = dm.id
                    WHERE dm.mission_logic_type = 'STAY_BELOW_SUM'
                      AND umr.status = 'in_progress'
                      AND DATE(umr.created_at) = CURDATE()
                `;
                const [missionsToEvaluate] = await db.execute(sql);

                for (const mission of missionsToEvaluate) {
                    if (mission.progress <= mission.target_value) {
                        // Misi Berhasil: Update status dan berikan poin
                        await db.execute(
                            "UPDATE user_mission_records SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
                            [mission.id]
                        );
                       //await UserPoint.addPoints(mission.user_id, mission.point_reward, `mission_complete_${mission.mission_id}`);
                        console.log(`[${new Date().toISOString()}] CRON: Misi ${mission.mission_id} untuk user ${mission.user_id} BERHASIL dan siap diklaim.`);
                    } else {
                        // Misi Gagal: Update status menjadi 'failed'
                        await db.execute(
                            "UPDATE user_mission_records SET status = 'failed' WHERE id = ?",
                            [mission.id]
                        );
                        console.log(`[${new Date().toISOString()}] CRON: Misi ${mission.mission_id} untuk user ${mission.user_id} GAGAL.`);
                    }
                }
                console.log(`[${new Date().toISOString()}] CRON: Evaluasi misi akhir hari selesai.`);
            } catch (error) {
                console.error(`[${new Date().toISOString()}] CRON ERROR: Gagal saat evaluasi misi akhir hari:`, error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Jakarta"
        });
    }
};

module.exports = scheduler;