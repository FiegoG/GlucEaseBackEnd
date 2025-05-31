// controllers/weeklyReportController.js
const db = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const weeklyReportController = {
    // Get weekly sugar intake summary
    getWeeklySugarIntake: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            // Query untuk mendapatkan data asupan gula mingguan
            const query = `
                SELECT 
                    DAYNAME(date) as day_name,
                    DAYOFWEEK(date) as day_number,
                    DATE(date) as date,
                    SUM(sugar) as total_sugar,
                    CASE 
                        WHEN SUM(sugar) <= 25 THEN 'NORMAL'
                        WHEN SUM(sugar) BETWEEN 26 AND 50 THEN 'MENDEKATI'
                        ELSE 'MELEBIHI'
                    END as status
                FROM foods 
                WHERE user_id = ? 
                AND date BETWEEN ? AND ?
                GROUP BY DATE(date), DAYNAME(date), DAYOFWEEK(date)
                ORDER BY DAYOFWEEK(date)
            `;

            const [results] = await db.execute(query, [userId, startDate, endDate]);
            
            // Format data untuk semua hari dalam seminggu
            const daysOfWeek = [
                { name: 'SENIN', number: 2 },
                { name: 'SELASA', number: 3 },
                { name: 'RABU', number: 4 },
                { name: 'KAMIS', number: 5 },
                { name: 'JUMAT', number: 6 },
                { name: 'SABTU', number: 7 },
                { name: 'MINGGU', number: 1 }
            ];

            const weeklyData = daysOfWeek.map(day => {
                const dayData = results.find(result => result.day_number === day.number);
                return {
                    day: day.name,
                    total_sugar: dayData ? parseFloat(dayData.total_sugar) : 0,
                    status: dayData ? dayData.status : 'NORMAL',
                    date: dayData ? dayData.date : null
                };
            });

            res.json({
                success: true,
                data: weeklyData
            });

        } catch (error) {
            console.error('Error getting weekly sugar intake:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly sugar intake data',
                error: error.message
            });
        }
    },

    // Get weekly blood sugar summary
    getWeeklyBloodSugar: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            const query = `
                SELECT 
                    DAYNAME(check_date) as day_name,
                    DAYOFWEEK(check_date) as day_number,
                    DATE(check_date) as date,
                    AVG(blood_sugar_level) as avg_blood_sugar,
                    CASE 
                        WHEN AVG(blood_sugar_level) BETWEEN 70 AND 140 THEN 'NORMAL'
                        WHEN AVG(blood_sugar_level) BETWEEN 141 AND 199 THEN 'MENDEKATI'
                        ELSE 'MELEBIHI'
                    END as status
                FROM blood_sugar_records 
                WHERE user_id = ? 
                AND check_date BETWEEN ? AND ?
                GROUP BY DATE(check_date), DAYNAME(check_date), DAYOFWEEK(check_date)
                ORDER BY DAYOFWEEK(check_date)
            `;

            const [results] = await db.execute(query, [userId, startDate, endDate]);
            
            const daysOfWeek = [
                { name: 'SENIN', number: 2 },
                { name: 'SELASA', number: 3 },
                { name: 'RABU', number: 4 },
                { name: 'KAMIS', number: 5 },
                { name: 'JUMAT', number: 6 },
                { name: 'SABTU', number: 7 },
                { name: 'MINGGU', number: 1 }
            ];

            const weeklyData = daysOfWeek.map(day => {
                const dayData = results.find(result => result.day_number === day.number);
                return {
                    day: day.name,
                    avg_blood_sugar: dayData ? Math.round(parseFloat(dayData.avg_blood_sugar)) : 0,
                    status: dayData ? dayData.status : 'NORMAL',
                    date: dayData ? dayData.date : null
                };
            });

            res.json({
                success: true,
                data: weeklyData
            });

        } catch (error) {
            console.error('Error getting weekly blood sugar:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving weekly blood sugar data',
                error: error.message
            });
        }
    },

    // Generate AI analysis for sugar intake
    generateSugarIntakeAnalysis: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            // Get sugar intake data
            const query = `
                SELECT 
                    DAYNAME(date) as day_name,
                    SUM(sugar) as total_sugar
                FROM foods 
                WHERE user_id = ? 
                AND date BETWEEN ? AND ?
                GROUP BY DATE(date), DAYNAME(date), DAYOFWEEK(date)
                ORDER BY DAYOFWEEK(date)
            `;

            const [results] = await db.execute(query, [userId, startDate, endDate]);

            // Prepare data for AI analysis
            const dataText = results.map(row => 
                `${row.day_name}: ${row.total_sugar}g gula`
            ).join(', ');

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

            // Parse JSON response from AI
            let analysis;
            try {
                analysis = JSON.parse(analysisText);
            } catch (parseError) {
                // Fallback if AI doesn't return valid JSON
                analysis = {
                    kesimpulan: analysisText,
                    saran: ["Konsultasikan dengan dokter untuk panduan yang lebih spesifik"],
                    peringatan: null
                };
            }

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('Error generating sugar intake analysis:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating AI analysis',
                error: error.message
            });
        }
    },

    // Generate AI analysis for blood sugar
    generateBloodSugarAnalysis: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            // Get blood sugar data
            const query = `
                SELECT 
                    DAYNAME(check_date) as day_name,
                    AVG(blood_sugar_level) as avg_blood_sugar
                FROM blood_sugar_records 
                WHERE user_id = ? 
                AND check_date BETWEEN ? AND ?
                GROUP BY DATE(check_date), DAYNAME(check_date), DAYOFWEEK(check_date)
                ORDER BY DAYOFWEEK(check_date)
            `;

            const [results] = await db.execute(query, [userId, startDate, endDate]);

            // Prepare data for AI analysis
            const dataText = results.map(row => 
                `${row.day_name}: ${Math.round(row.avg_blood_sugar)} mg/dL`
            ).join(', ');

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

            // Parse JSON response from AI
            let analysis;
            try {
                analysis = JSON.parse(analysisText);
            } catch (parseError) {
                analysis = {
                    kesimpulan: analysisText,
                    saran: ["Konsultasikan dengan dokter untuk evaluasi lebih lanjut"],
                    peringatan: "Selalu konsultasikan hasil dengan tenaga medis profesional"
                };
            }

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('Error generating blood sugar analysis:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating AI analysis',
                error: error.message
            });
        }
    },

    // Get complete weekly report
    getCompleteWeeklyReport: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            // Get all data in parallel
            const [sugarIntakeData, bloodSugarData] = await Promise.all([
                weeklyReportController.getWeeklySugarIntakeData(userId, startDate, endDate),
                weeklyReportController.getWeeklyBloodSugarData(userId, startDate, endDate)
            ]);

            res.json({
                success: true,
                data: {
                    period: {
                        startDate,
                        endDate
                    },
                    sugarIntake: sugarIntakeData,
                    bloodSugar: bloodSugarData
                }
            });

        } catch (error) {
            console.error('Error getting complete weekly report:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving complete weekly report',
                error: error.message
            });
        }
    },

    // Helper function to get sugar intake data
    getWeeklySugarIntakeData: async (userId, startDate, endDate) => {
        const query = `
            SELECT 
                DAYNAME(date) as day_name,
                DAYOFWEEK(date) as day_number,
                DATE(date) as date,
                SUM(sugar) as total_sugar,
                CASE 
                    WHEN SUM(sugar) <= 25 THEN 'NORMAL'
                    WHEN SUM(sugar) BETWEEN 26 AND 50 THEN 'MENDEKATI'
                    ELSE 'MELEBIHI'
                END as status
            FROM foods 
            WHERE user_id = ? 
            AND date BETWEEN ? AND ?
            GROUP BY DATE(date), DAYNAME(date), DAYOFWEEK(date)
            ORDER BY DAYOFWEEK(date)
        `;

        const [results] = await db.execute(query, [userId, startDate, endDate]);
        
        const daysOfWeek = [
            { name: 'SENIN', number: 2 },
            { name: 'SELASA', number: 3 },
            { name: 'RABU', number: 4 },
            { name: 'KAMIS', number: 5 },
            { name: 'JUMAT', number: 6 },
            { name: 'SABTU', number: 7 },
            { name: 'MINGGU', number: 1 }
        ];

        return daysOfWeek.map(day => {
            const dayData = results.find(result => result.day_number === day.number);
            return {
                day: day.name,
                total_sugar: dayData ? parseFloat(dayData.total_sugar) : 0,
                status: dayData ? dayData.status : 'NORMAL',
                date: dayData ? dayData.date : null
            };
        });
    },

    // Helper function to get blood sugar data
    getWeeklyBloodSugarData: async (userId, startDate, endDate) => {
        const query = `
            SELECT 
                DAYNAME(check_date) as day_name,
                DAYOFWEEK(check_date) as day_number,
                DATE(check_date) as date,
                AVG(blood_sugar_level) as avg_blood_sugar,
                CASE 
                    WHEN AVG(blood_sugar_level) BETWEEN 70 AND 140 THEN 'NORMAL'
                    WHEN AVG(blood_sugar_level) BETWEEN 141 AND 199 THEN 'MENDEKATI'
                    ELSE 'MELEBIHI'
                END as status
            FROM blood_sugar_records 
            WHERE user_id = ? 
            AND check_date BETWEEN ? AND ?
            GROUP BY DATE(check_date), DAYNAME(check_date), DAYOFWEEK(check_date)
            ORDER BY DAYOFWEEK(check_date)
        `;

        const [results] = await db.execute(query, [userId, startDate, endDate]);
        
        const daysOfWeek = [
            { name: 'SENIN', number: 2 },
            { name: 'SELASA', number: 3 },
            { name: 'RABU', number: 4 },
            { name: 'KAMIS', number: 5 },
            { name: 'JUMAT', number: 6 },
            { name: 'SABTU', number: 7 },
            { name: 'MINGGU', number: 1 }
        ];

        return daysOfWeek.map(day => {
            const dayData = results.find(result => result.day_number === day.number);
            return {
                day: day.name,
                avg_blood_sugar: dayData ? Math.round(parseFloat(dayData.avg_blood_sugar)) : 0,
                status: dayData ? dayData.status : 'NORMAL',
                date: dayData ? dayData.date : null
            };
        });
    }
};

module.exports = weeklyReportController;