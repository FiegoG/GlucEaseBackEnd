// controllers/weeklyReportController.js
const db = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cron = require('node-cron');

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'NOT LOADED or Empty');
console.log('Type of GoogleGenerativeAI:', typeof GoogleGenerativeAI); // Harusnya 'function' (karena ini adalah constructor/class)
console.log('GoogleGenerativeAI constructor:', GoogleGenerativeAI);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-05-06" });

console.log('Type of genAI:', typeof genAI); // Harusnya 'object'
console.log('Does genAI have listModels?', typeof genAI.listModels); // Harusnya 'function'
console.log('Is genAI instance of GoogleGenerativeAI?', genAI instanceof GoogleGenerativeAI); // Harusnya true

async function listAvailableModels() {
    try {
        console.log('--- Listing Available Gemini Models ---');
        const result = await genAI.listModels();
        const models = await result.models;

        if (models.length === 0) {
            console.log('No models found. Please check your API key and network connection.');
            return;
        }

        console.log('Available models:');
        for (const model of models) {
            // Filter hanya model yang mendukung metode 'generateContent' jika itu yang Anda butuhkan
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- Name: ${model.name}`);
                console.log(`  Display Name: ${model.displayName}`);
                console.log(`  Description: ${model.description}`);
                console.log(`  Input Token Limit: ${model.inputTokenLimit}`);
                console.log(`  Output Token Limit: ${model.outputTokenLimit}`);
                console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log('---');
            }
        }
    } catch (error) {
        console.error('Error listing models:', error);
        console.error('Possible causes: Invalid API Key, network issues, or API not enabled.');
    }
}

// Panggil fungsi ini untuk melihat daftar model
listAvailableModels();

const weeklyReportController = {
    // Generate weekly report - dipanggil oleh cron job setiap akhir minggu
    generateWeeklyReports: async () => {
        try {
            console.log('Starting weekly report generation...');
            
            // Get all active users
            const [users] = await db.execute('SELECT id FROM users WHERE is_active = 1');
            
            for (const user of users) {
                await weeklyReportController.generateUserWeeklyReport(user.id);
            }
            
            console.log(`Weekly reports generated for ${users.length} users`);
        } catch (error) {
            console.error('Error generating weekly reports:', error);
        }
    },

    // Generate weekly report untuk user tertentu
    generateUserWeeklyReport: async (userId) => {
        try {
            // Calculate date range (last week: Monday to Sunday)
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (endDate.getDay() === 0 ? 0 : endDate.getDay())); // Last Sunday
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6); // Monday of that week

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Get sugar intake data for the week
            const sugarIntakeData = await weeklyReportController.getWeeklySugarIntakeData(userId, startDateStr, endDateStr);
            
            // Get blood sugar data for the week
            const bloodSugarData = await weeklyReportController.getWeeklyBloodSugarData(userId, startDateStr, endDateStr);

            // Generate AI analysis for sugar intake
            const sugarIntakeAnalysis = await weeklyReportController.generateAISugarIntakeAnalysis(sugarIntakeData);
            
            // Generate AI analysis for blood sugar
            const bloodSugarAnalysis = await weeklyReportController.generateAIBloodSugarAnalysis(bloodSugarData);

            // Save to weekly_reports table
            const weeklyReportId = await weeklyReportController.saveWeeklyReport(
                userId, 
                startDateStr, 
                endDateStr, 
                sugarIntakeAnalysis, 
                bloodSugarAnalysis
            );

            // Save daily metrics to daily_health_metrics table
            await weeklyReportController.saveDailyHealthMetrics(
                userId, 
                weeklyReportId, 
                sugarIntakeData, 
                bloodSugarData
            );

            console.log(`Weekly report generated for user ${userId}`);
            return weeklyReportId;

        } catch (error) {
            console.error(`Error generating weekly report for user ${userId}:`, error);
            throw error;
        }
    },

    // Get latest weekly report untuk ditampilkan ke user
    getLatestWeeklyReport: async (req, res) => {
        try {
            const { userId } = req.params;

            // Get latest weekly report
            const reportQuery = `
                SELECT 
                    wr.*,
                    DATE_FORMAT(wr.week_start_date, '%d %M %Y') as formatted_start_date,
                    DATE_FORMAT(wr.week_end_date, '%d %M %Y') as formatted_end_date
                FROM weekly_reports wr
                WHERE wr.user_id = ?
                ORDER BY wr.week_end_date DESC
                LIMIT 1
            `;

            const [reportRows] = await db.execute(reportQuery, [userId]);

            if (reportRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Belum ada laporan mingguan yang tersedia'
                });
            }

            const report = reportRows[0];

            // Get daily health metrics for this report
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
                        WHEN dhm.total_sugar <= 25 THEN 'NORMAL'
                        WHEN dhm.total_sugar BETWEEN 26 AND 50 THEN 'MENDEKATI'
                        ELSE 'MELEBIHI'
                    END as sugar_status,
                    CASE 
                        WHEN dhm.avg_blood_sugar BETWEEN 70 AND 140 THEN 'NORMAL'
                        WHEN dhm.avg_blood_sugar BETWEEN 141 AND 199 THEN 'MENDEKATI'
                        ELSE 'MELEBIHI'
                    END as blood_sugar_status
                FROM daily_health_metrics dhm
                WHERE dhm.weekly_report_id = ?
                ORDER BY dhm.day_of_week
            `;

            const [metricsRows] = await db.execute(metricsQuery, [report.id]);

            // Format daily data
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

            // Parse AI analysis
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

            res.json({
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
            });

        } catch (error) {
            console.error('Error getting latest weekly report:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly report',
                error: error.message
            });
        }
    },

    // Get all weekly reports untuk history
    getWeeklyReportsHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

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
                ORDER BY week_end_date DESC
                LIMIT ? OFFSET ?
            `;

            const [rows] = await db.execute(query, [userId, parseInt(limit), parseInt(offset)]);

            // Get total count
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

    // Get specific weekly report by ID
    getWeeklyReportById: async (req, res) => {
        try {
            const { userId, reportId } = req.params;

            // Get specific weekly report
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
                    message: 'Laporan tidak ditemukan'
                });
            }

            const report = reportRows[0];

            // Get daily health metrics for this report
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
                    END as day_name
                FROM daily_health_metrics dhm
                WHERE dhm.weekly_report_id = ?
                ORDER BY dhm.day_of_week
            `;

            const [metricsRows] = await db.execute(metricsQuery, [report.id]);

            // Format response sama seperti getLatestWeeklyReport
            const dailyData = metricsRows.map(metric => ({
                day: metric.day_name,
                date: metric.date,
                sugar_intake: {
                    total_sugar: parseFloat(metric.total_sugar) || 0,
                    status: metric.total_sugar <= 25 ? 'NORMAL' : (metric.total_sugar <= 50 ? 'MENDEKATI' : 'MELEBIHI')
                },
                blood_sugar: {
                    avg_blood_sugar: Math.round(parseFloat(metric.avg_blood_sugar)) || 0,
                    status: (metric.avg_blood_sugar >= 70 && metric.avg_blood_sugar <= 140) ? 'NORMAL' : 
                           (metric.avg_blood_sugar <= 199 ? 'MENDEKATI' : 'MELEBIHI')
                }
            }));

            // Parse AI analysis
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

            res.json({
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
            });

        } catch (error) {
            console.error('Error getting weekly report by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly report',
                error: error.message
            });
        }
    },

    // Helper function untuk mendapatkan data asupan gula mingguan
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
        
        // Ensure all days of week are represented
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

    // Helper function untuk mendapatkan data gula darah mingguan
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
        try {
            const dataText = weeklyData
                .filter(day => day.total_sugar > 0)
                .map(day => {
                    const dayNames = ['', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    return `${dayNames[day.day_of_week]}: ${day.total_sugar}g gula`;
                })
                .join(', ');

            if (!dataText) {
                return {
                    kesimpulan: "Tidak ada data asupan gula yang tercatat minggu ini.",
                    saran: [
                        "Mulai mencatat asupan makanan harian",
                        "Perhatikan kandungan gula dalam makanan",
                        "Konsultasikan pola makan dengan ahli gizi"
                    ],
                    peringatan: null
                };
            }

            const prompt = `
                Berdasarkan data asupan gula harian pengguna selama seminggu: ${dataText}
                
                Berikan analisis dalam format JSON dengan struktur berikut:
                {
                    "kesimpulan": "kesimpulan singkat tentang pola asupan gula pengguna",
                    "saran": [
                        "saran 1 untuk menjaga asupan gula",
                        "saran 2 untuk menjaga asupan gula",
                        "saran 3 untuk menjaga asupan gula"
                    ],
                    "peringatan": "peringatan jika diperlukan atau null jika tidak ada"
                }

                Catatan: Batas asupan gula harian yang direkomendasikan adalah 25g untuk dewasa.
                Berikan respons dalam bahasa Indonesia yang mudah dipahami.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysisText = response.text();

            try {
                return JSON.parse(analysisText);
            } catch (parseError) {
                return {
                    kesimpulan: analysisText,
                    saran: ["Konsultasikan dengan dokter untuk panduan yang lebih spesifik"],
                    peringatan: null
                };
            }
        } catch (error) {
            console.error('Error generating AI sugar intake analysis:', error);
            return {
                kesimpulan: "Terjadi kesalahan dalam menganalisis data asupan gula.",
                saran: ["Konsultasikan dengan dokter untuk panduan yang lebih spesifik"],
                peringatan: null
            };
        }
    },

    // Generate AI analysis untuk blood sugar
    generateAIBloodSugarAnalysis: async (weeklyData) => {
        try {
            const dataText = weeklyData
                .filter(day => day.avg_blood_sugar > 0)
                .map(day => {
                    const dayNames = ['', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    return `${dayNames[day.day_of_week]}: ${Math.round(day.avg_blood_sugar)} mg/dL`;
                })
                .join(', ');

            if (!dataText) {
                return {
                    kesimpulan: "Tidak ada data gula darah yang tercatat minggu ini.",
                    saran: [
                        "Lakukan pemeriksaan gula darah secara rutin",
                        "Catat hasil pemeriksaan setiap hari",
                        "Konsultasikan dengan dokter untuk evaluasi"
                    ],
                    peringatan: "Pemantauan gula darah rutin sangat penting untuk kesehatan"
                };
            }

            const prompt = `
                Berdasarkan data kadar gula darah rata-rata pengguna selama seminggu: ${dataText}
                
                Berikan analisis dalam format JSON dengan struktur berikut:
                {
                    "kesimpulan": "kesimpulan tentang kondisi gula darah pengguna",
                    "saran": [
                        "saran 1 untuk menjaga kadar gula darah",
                        "saran 2 untuk menjaga kadar gula darah",
                        "saran 3 untuk menjaga kadar gula darah"
                    ],
                    "peringatan": "peringatan medis jika diperlukan atau null jika tidak ada"
                }

                Catatan: 
                - Normal: 70-140 mg/dL
                - Prediabetes: 141-199 mg/dL  
                - Diabetes: ≥200 mg/dL
                Berikan respons dalam bahasa Indonesia dan sarankan konsultasi dokter jika diperlukan.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysisText = response.text();

            try {
                return JSON.parse(analysisText);
            } catch (parseError) {
                return {
                    kesimpulan: analysisText,
                    saran: ["Konsultasikan dengan dokter untuk evaluasi lebih lanjut"],
                    peringatan: "Selalu konsultasikan hasil dengan tenaga medis profesional"
                };
            }
        } catch (error) {
            console.error('Error generating AI blood sugar analysis:', error);
            return {
                kesimpulan: "Terjadi kesalahan dalam menganalisis data gula darah.",
                saran: ["Konsultasikan dengan dokter untuk evaluasi lebih lanjut"],
                peringatan: "Selalu konsultasikan hasil dengan tenaga medis profesional"
            };
        }
    },

    // Save weekly report ke database
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

    // Save daily health metrics ke database
    saveDailyHealthMetrics: async (userId, weeklyReportId, sugarIntakeData, bloodSugarData) => {
        const insertPromises = [];

        for (let i = 0; i < 7; i++) {
            const sugarData = sugarIntakeData[i];
            const bloodData = bloodSugarData[i];

            if (sugarData.total_sugar > 0 || bloodData.avg_blood_sugar > 0) {
                const query = `
                    INSERT INTO daily_health_metrics 
                    (weekly_report_id, date, day_of_week, total_sugar, avg_blood_sugar, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;

                insertPromises.push(
                    db.execute(query, [
                        userId,
                        weeklyReportId,
                        sugarData.date || bloodData.date,
                        sugarData.day_of_week,
                        sugarData.total_sugar,
                        bloodData.avg_blood_sugar
                    ])
                );
            } else if (currentDate) { // Jika Anda ingin setiap hari ada entri meskipun 0
             const query = `
                INSERT INTO daily_health_metrics
                (weekly_report_id, date, day_of_week, daily_sugar_intake, daily_blood_sugar, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            insertPromises.push(
                db.execute(query, [
                    weeklyReportId,
                    currentDate,
                    currentDayOfWeek,
                    0, // Default to 0
                    0  // Default to 0
                ])
            );
        }
        }

        await Promise.all(insertPromises);
    }
};

// Setup cron job untuk generate laporan setiap akhir minggu (Sabtu jam 23:59)
cron.schedule('59 23 * * 6', async () => {
    console.log('Running weekly report generation...');
    await weeklyReportController.generateWeeklyReports();
}, {
    timezone: "Asia/Jakarta"
});

module.exports = weeklyReportController;