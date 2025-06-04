// controllers/dummyReportController.js
const db = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cron = require('node-cron');

const dummyReportController = {
    // Generate weekly report - dipanggil oleh cron job setiap akhir minggu
    generateWeeklyReports: async () => {
        try {
            console.log('Starting weekly report generation...');
            
            const [users] = await db.execute('SELECT id FROM users');
            
            for (const user of users) {
                await dummyReportController.generateUserWeeklyReport(user.id);
            }
            
            console.log(`Weekly reports generated for ${users.length} users`);
        } catch (error) {
            console.error('Error generating weekly reports:', error);
        }
    },

    // Generate weekly report untuk user tertentu
    generateUserWeeklyReport: async (userId) => {
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (endDate.getDay() === 0 ? 0 : endDate.getDay())); 
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Check if report already exists for this period
            const [existingReport] = await db.execute(
                'SELECT id FROM weekly_reports WHERE user_id = ? AND week_start_date = ? AND week_end_date = ?',
                [userId, startDateStr, endDateStr]
            );

            if (existingReport.length > 0) {
                console.log(`Weekly report already exists for user ${userId} for period ${startDateStr} to ${endDateStr}`);
                return existingReport[0].id;
            }

            const sugarIntakeData = await dummyReportController.getWeeklySugarIntakeData(userId, startDateStr, endDateStr);
            const bloodSugarData = await dummyReportController.getWeeklyBloodSugarData(userId, startDateStr, endDateStr);
            
            // Panggil fungsi AI yang sudah dimodifikasi
            const sugarIntakeAnalysis = await dummyReportController.generateAISugarIntakeAnalysis(sugarIntakeData);
            const bloodSugarAnalysis = await dummyReportController.generateAIBloodSugarAnalysis(bloodSugarData);

            const weeklyReportId = await dummyReportController.saveWeeklyReport(
                userId, 
                startDateStr, 
                endDateStr, 
                sugarIntakeAnalysis, 
                bloodSugarAnalysis
            );

            await dummyReportController.saveDailyHealthMetrics(
                userId, 
                weeklyReportId, 
                sugarIntakeData, 
                bloodSugarData,
                startDate
            );

            console.log(`Weekly report generated for user ${userId}`);
            return weeklyReportId;

        } catch (error) {
            console.error(`Error generating weekly report for user ${userId}:`, error);
            throw error;
        }
    },

    // Manual trigger untuk generate report - untuk testing/debugging
    generateReportManually: async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Validate userId
            const [userExists] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            const reportId = await dummyReportController.generateUserWeeklyReport(userId);
            
            res.json({
                success: true,
                message: 'Laporan mingguan berhasil dibuat',
                data: { reportId }
            });
        } catch (error) {
            console.error('Error generating manual report:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating report',
                error: error.message
            });
        }
    },

    getLatestWeeklyReport: async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Validate userId first
            const [userExists] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            const reportQuery = `
                SELECT 
                    wr.*,
                    DATE_FORMAT(wr.week_start_date, '%d %M %Y') as formatted_start_date,
                    DATE_FORMAT(wr.week_end_date, '%d %M %Y') as formatted_end_date
                FROM weekly_reports wr
                WHERE wr.user_id = ?
                ORDER BY wr.week_end_date DESC, wr.created_at DESC
                LIMIT 1
            `;
            const [reportRows] = await db.execute(reportQuery, [userId]);

            if (reportRows.length === 0) {
                // Try to generate a report if none exists
                console.log(`No weekly report found for user ${userId}, attempting to generate one...`);
                try {
                    const reportId = await dummyReportController.generateUserWeeklyReport(userId);
                    const [newReportRows] = await db.execute(reportQuery, [userId]);
                    
                    if (newReportRows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Belum ada data yang cukup untuk membuat laporan mingguan. Silakan input data terlebih dahulu.'
                        });
                    }
                    
                    const report = newReportRows[0];
                    return res.json(await formatReportResponse(report));
                } catch (generateError) {
                    console.error('Error auto-generating report:', generateError);
                    return res.status(404).json({
                        success: false,
                        message: 'Belum ada laporan mingguan yang tersedia. Silakan tunggu sistem membuat laporan otomatis atau hubungi administrator.'
                    });
                }
            }
            
            const report = reportRows[0];
            const formattedResponse = await formatReportResponse(report);
            res.json(formattedResponse);

        } catch (error) {
            console.error('Error getting latest weekly report:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly report',
                error: error.message
            });
        }
    },

    getWeeklyReportsHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // Validate userId first
            const [userExists] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            const query = `
                SELECT 
                    id,
                    DATE_FORMAT(week_start_date, '%d %M %Y') as formatted_start_date,
                    DATE_FORMAT(week_end_date, '%d %M %Y') as formatted_end_date,
                    week_start_date,
                    week_end_date,
                    created_at
                FROM weekly_reports
                WHERE user_id = ?
                ORDER BY week_end_date DESC, created_at DESC
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.execute(query, [userId, parseInt(limit), parseInt(offset)]);
            
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM weekly_reports WHERE user_id = ?',
                [userId]
            );

            res.json({
                success: true,
                data: {
                    reports: rows,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(countResult[0].total / limit),
                        total_reports: countResult[0].total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting weekly reports history:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving reports history',
                error: error.message
            });
        }
    },

    getWeeklyReportById: async (req, res) => {
        try {
            const { userId, reportId } = req.params;
            
            // Validate userId first
            const [userExists] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (userExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan A1'
                });
            }

            const reportQuery = `
                SELECT 
                    wr.*,
                    DATE_FORMAT(wr.week_start_date, '%d %M %Y') as formatted_start_date,
                    DATE_FORMAT(wr.week_end_date, '%d %M %Y') as formatted_end_date
                FROM weekly_reports wr
                WHERE wr.id = ? AND wr.user_id = ?
            `;
            const [reportRows] = await db.execute(reportQuery, [reportId, userId]);

            if (reportRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Laporan tidak ditemukan atau Anda tidak memiliki akses ke laporan ini'
                });
            }
            
            const report = reportRows[0];
            const formattedResponse = await formatReportResponse(report);
            res.json(formattedResponse);

        } catch (error) {
            console.error('Error getting weekly report by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly report',
                error: error.message
            });
        }
    },

    getWeeklySugarIntakeData: async (userId, startDate, endDate) => {
        const query = `
            SELECT 
                DAYOFWEEK(sir.date) as day_of_week,
                DATE(sir.date) as date,
                SUM(f.sugar * sir.quantity) as total_sugar
            FROM sugar_intake_records sir
            JOIN foods f ON sir.food_id = f.id 
            WHERE sir.user_id = ? 
            AND sir.date BETWEEN ? AND ?
            GROUP BY DATE(sir.date), DAYOFWEEK(sir.date)
            ORDER BY DAYOFWEEK(sir.date)
        `;
        const [results] = await db.execute(query, [userId, startDate, endDate]);
        const daysOfWeek = [1, 2, 3, 4, 5, 6, 7]; // Sunday to Saturday
        return daysOfWeek.map(dayNum => {
            const dayData = results.find(result => result.day_of_week === dayNum);
            return {
                day_of_week: dayNum,
                date: dayData ? dayData.date : null,
                total_sugar: dayData ? parseFloat(dayData.total_sugar) : 0
            };
        });
    },

    getWeeklyBloodSugarData: async (userId, startDate, endDate) => {
        const query = `
            SELECT 
                DAYOFWEEK(check_date) as day_of_week,
                DATE(check_date) as date,
                AVG(blood_sugar_level) as avg_blood_sugar
            FROM blood_sugar_records 
            WHERE user_id = ? 
            AND check_date BETWEEN ? AND ?
            GROUP BY DATE(check_date), DAYOFWEEK(check_date)
            ORDER BY DAYOFWEEK(check_date)
        `;
        const [results] = await db.execute(query, [userId, startDate, endDate]);
        const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];
        return daysOfWeek.map(dayNum => {
            const dayData = results.find(result => result.day_of_week === dayNum);
            return {
                day_of_week: dayNum,
                date: dayData ? dayData.date : null,
                avg_blood_sugar: dayData ? parseFloat(dayData.avg_blood_sugar) : 0
            };
        });
    },

    // Generate AI analysis untuk sugar intake
    generateAISugarIntakeAnalysis: async (weeklyData) => {
        console.log("Skipping actual AI call for Sugar Intake, returning placeholder.");
        return {
            kesimpulan: "AI under construction",
            saran: ["AI under construction"],
            peringatan: "AI under construction"
        };
    },

    // Generate AI analysis untuk blood sugar
    generateAIBloodSugarAnalysis: async (weeklyData) => {
        console.log("Skipping actual AI call for Blood Sugar, returning placeholder.");
        return {
            kesimpulan: "AI under construction",
            saran: ["AI under construction"],
            peringatan: "AI under construction"
        };
    },

    saveWeeklyReport: async (userId, startDate, endDate, sugarIntakeAnalysis, bloodSugarAnalysis) => {
        const query = `
            INSERT INTO weekly_reports 
            (user_id, week_start_date, week_end_date, sugar_intake_summary, blood_sugar_summary, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await db.execute(query, [
            userId,
            startDate,
            endDate,
            JSON.stringify(sugarIntakeAnalysis),
            JSON.stringify(bloodSugarAnalysis)
        ]);
        return result.insertId;
    },

    saveDailyHealthMetrics: async (userId, weeklyReportId, sugarIntakeData, bloodSugarData, weekStartDateObj) => {
        const insertPromises = [];
        const currentDay = new Date(weekStartDateObj);

        for (let i = 0; i < 7; i++) {
            const sugarDataForDay = sugarIntakeData.find(d => d.day_of_week === (currentDay.getDay() + 1));
            const bloodDataForDay = bloodSugarData.find(d => d.day_of_week === (currentDay.getDay() + 1));
            
            const dateStr = currentDay.toISOString().split('T')[0];
            const dayOfWeek = currentDay.getDay() + 1;

            const totalSugar = sugarDataForDay ? sugarDataForDay.total_sugar : 0;
            const avgBloodSugar = bloodDataForDay ? bloodDataForDay.avg_blood_sugar : 0;

            const query = `
                INSERT INTO daily_health_metrics 
                (weekly_report_id, date, day_of_week, daily_sugar_intake, daily_blood_sugar, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                daily_sugar_intake = VALUES(daily_sugar_intake), 
                daily_blood_sugar = VALUES(daily_blood_sugar),
                updated_at = NOW()
            `;

            insertPromises.push(
                db.execute(query, [
                    userId,
                    weeklyReportId,
                    dateStr,
                    dayOfWeek,
                    totalSugar,
                    avgBloodSugar
                ])
            );
            
            currentDay.setDate(currentDay.getDate() + 1);
        }
        await Promise.all(insertPromises);
    }
};

// Helper function untuk format response
async function formatReportResponse(report) {
    const metricsQuery = `
        SELECT 
            dhm.*, 
            CASE 
                WHEN dhm.day_of_week = 1 THEN 'MINGGU'
                WHEN dhm.day_of_week = 2 THEN 'SENIN'
                WHEN dhm.day_of_week = 3 THEN 'SELASA'
                WHEN dhm.day_of_week = 4 THEN 'RABU'
                WHEN dhm.day_of_week = 5 THEN 'KAMIS'
                WHEN dhm.day_of_week = 6 THEN 'JUMAT'
                WHEN dhm.day_of_week = 7 THEN 'SABTU'
            END as day_name,
            CASE 
                WHEN dhm.daily_sugar_intake <= 25 THEN 'NORMAL'
                WHEN dhm.daily_sugar_intake BETWEEN 26 AND 50 THEN 'MENDEKATI'
                ELSE 'MELEBIHI'
            END as sugar_status,
            CASE 
                WHEN dhm.daily_blood_sugar BETWEEN 70 AND 140 THEN 'NORMAL'
                WHEN dhm.daily_blood_sugar BETWEEN 141 AND 199 THEN 'MENDEKATI'
                WHEN dhm.daily_blood_sugar = 0 AND dhm.daily_sugar_intake = 0 THEN 'TIDAK ADA DATA' 
                ELSE 'MELEBIHI'
            END as blood_sugar_status -- This alias is used below
        FROM daily_health_metrics dhm
        WHERE dhm.weekly_report_id = ?
        ORDER BY dhm.day_of_week ASC
    `;
    const [metricsRows] = await db.execute(metricsQuery, [report.id]);
    
    const dailyData = metricsRows.map(metric => ({
        day: metric.day_name,
        date: metric.date,
        sugar_intake: {
            total_sugar: parseFloat(metric.total_sugar) || 0,
            status: metric.sugar_status
        },
        blood_sugar: {
            avg_blood_sugar: Math.round(parseFloat(metric.avg_blood_sugar)) || 0,
            status: metric.blood_sugar_status
        }
    }));

    let sugarIntakeAnalysis, bloodSugarAnalysis;
    try {
        sugarIntakeAnalysis = JSON.parse(report.sugar_intake_summary);
        bloodSugarAnalysis = JSON.parse(report.blood_sugar_summary);
    } catch (parseError) {
        sugarIntakeAnalysis = {
            kesimpulan: report.sugar_intake_summary || "Data tidak tersedia",
            saran: ["Konsultasikan dengan dokter untuk panduan yang lebih spesifik"],
            peringatan: null
        };
        bloodSugarAnalysis = {
            kesimpulan: report.blood_sugar_summary || "Data tidak tersedia",
            saran: ["Konsultasikan dengan dokter untuk evaluasi lebih lanjut"],
            peringatan: "Selalu konsultasikan hasil dengan tenaga medis profesional"
        };
    }

    return {
        success: true,
        data: {
            report_info: {
                id: report.id,
                period: `${report.formatted_start_date} - ${report.formatted_end_date}`,
                generated_at: report.created_at
            },
            sugar_intake: {
                daily_data: dailyData.map(d => ({
                    day: d.day,
                    total_sugar: d.sugar_intake.total_sugar,
                    status: d.sugar_intake.status
                })),
                ai_analysis: sugarIntakeAnalysis
            },
            blood_sugar: {
                daily_data: dailyData.map(d => ({
                    day: d.day,
                    avg_blood_sugar: d.blood_sugar.avg_blood_sugar,
                    status: d.blood_sugar.status
                })),
                ai_analysis: bloodSugarAnalysis
            }
        }
    };
}

// Setup cron job - diubah ke jadwal yang proper untuk production
// Untuk testing, gunakan endpoint manual generate
cron.schedule('59 23 * * 6', async () => { // Sabtu 23:59
// cron.schedule('*/5 * * * *', async () => { // Uncomment untuk testing setiap 5 menit
    console.log(`Running scheduled job at ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} Jakarta time.`);
    if (process.env.NODE_ENV !== 'test') {
         console.log('Running weekly report generation by cron...');
         await dummyReportController.generateWeeklyReports();
    } else {
        console.log('Skipping cron job in test environment.');
    }
}, {
    timezone: "Asia/Jakarta"
});

console.log(`Cron job for weekly reports scheduled. Current time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

module.exports = dummyReportController;