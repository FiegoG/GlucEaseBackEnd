//src/models/sugarIntakeModel.js
const db = require('../config/db');

class SugarIntakeModel {
    // Menambahkan makanan ke tracker harian (dari halaman detail makanan)
    static async addFoodToTracker(userId, foodId) {
        try {
            // Cek apakah makanan sudah ada di tracker hari ini
            const checkQuery = `
                SELECT id, quantity 
                FROM sugar_intake_records 
                WHERE user_id = ? AND food_id = ? AND DATE(date) = CURDATE()
            `;
            const [existing] = await db.execute(checkQuery, [userId, foodId]);

            if (existing.length > 0) {
                // Jika sudah ada, tambah quantity sebanyak 1
                const updateQuery = `
                    UPDATE sugar_intake_records 
                    SET quantity = quantity + 1, updated_at = NOW()
                    WHERE id = ?
                `;
                await db.execute(updateQuery, [existing[0].id]);
                return existing[0].id;
            } else {
                // Jika belum ada, buat record baru dengan quantity 1
                const insertQuery = `
                    INSERT INTO sugar_intake_records (user_id, food_id, quantity, date, created_at, updated_at)
                    VALUES (?, ?, 1, CURDATE(), NOW(), NOW())
                `;
                const [result] = await db.execute(insertQuery, [userId, foodId]);
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // Mendapatkan ringkasan tracker harian untuk halaman utama
    static async getDailyTrackerSummary(userId, date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    COALESCE(SUM(sir.quantity * f.sugar), 0) as total_sugar,
                    COALESCE(SUM(sir.quantity * f.calories), 0) as total_calories,
                    COALESCE(SUM(sir.quantity * f.carbohydrate), 0) as total_carbohydrate,
                    COALESCE(SUM(sir.quantity * f.protein), 0) as total_protein,
                    COUNT(DISTINCT sir.food_id) as total_food_types,
                    COUNT(sir.id) as total_records
                FROM sugar_intake_records sir
                JOIN foods f ON sir.food_id = f.id
                WHERE sir.user_id = ? AND DATE(sir.date) = ?
            `;
            
            const [rows] = await db.execute(query, [userId, targetDate]);
            
            // Pastikan semua nilai numerik tidak null
            const result = rows[0] || {};
            return {
                total_sugar: parseFloat(result.total_sugar) || 0,
                total_calories: parseFloat(result.total_calories) || 0,
                total_carbohydrate: parseFloat(result.total_carbohydrate) || 0,
                total_protein: parseFloat(result.total_protein) || 0,
                total_food_types: parseInt(result.total_food_types) || 0,
                total_records: parseInt(result.total_records) || 0
            };
        } catch (error) {
            throw error;
        }
    }

    // Mendapatkan daftar makanan yang dikonsumsi hari ini untuk halaman utama
    static async getDailyFoodList(userId, date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    sir.id as intake_id,
                    sir.quantity,
                    sir.created_at,
                    f.id as food_id,
                    f.name as food_name,
                    f.portion_detail,
                    f.sugar,
                    f.calories,
                    f.carbohydrate,
                    f.protein,
                    (sir.quantity * f.sugar) as total_sugar,
                    (sir.quantity * f.calories) as total_calories
                FROM sugar_intake_records sir
                JOIN foods f ON sir.food_id = f.id
                WHERE sir.user_id = ? AND DATE(sir.date) = ?
                ORDER BY sir.created_at DESC
            `;
            
            const [rows] = await db.execute(query, [userId, targetDate]);
            
            // Pastikan nilai total_sugar dan total_calories tidak null
            return rows.map(row => ({
                ...row,
                total_sugar: parseFloat(row.total_sugar) || 0,
                total_calories: parseFloat(row.total_calories) || 0
            }));
        } catch (error) {
            throw error;
        }
    }

    // Update quantity makanan di tracker (jika user ingin mengubah porsi)
    static async updateFoodQuantity(intakeId, userId, newQuantity) {
        try {
            const query = `
                UPDATE sugar_intake_records 
                SET quantity = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ?
            `;
            const [result] = await db.execute(query, [newQuantity, intakeId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Menghapus makanan dari tracker harian
    static async removeFoodFromTracker(intakeId, userId) {
        try {
            const query = `
                DELETE FROM sugar_intake_records 
                WHERE id = ? AND user_id = ?
            `;
            const [result] = await db.execute(query, [intakeId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Mendapatkan status kesehatan berdasarkan asupan gula
    static getHealthStatus(totalSugar) {
        const recommendedDailyIntake = 25; // WHO recommendation: 25g per day
        const safeTotalSugar = parseFloat(totalSugar) || 0; // Handle null/undefined
        const percentage = (safeTotalSugar / recommendedDailyIntake) * 100;

        if (percentage <= 50) {
            return {
                status: 'excellent',
                message: 'Asupan gula Anda sangat baik',
                color: 'green'
            };
        } else if (percentage <= 80) {
            return {
                status: 'good',
                message: 'Asupan gula Anda dalam batas normal',
                color: 'blue'
            };
        } else if (percentage <= 100) {
            return {
                status: 'warning',
                message: 'Asupan gula Anda mendekati batas harian',
                color: 'yellow'
            };
        } else {
            return {
                status: 'danger',
                message: 'Asupan gula Anda melebihi batas harian',
                color: 'red'
            };
        }
    }
}

module.exports = SugarIntakeModel;