//src/models/foodModel.js
const db = require('../config/db');

class FoodModel {
    // Mendapatkan semua daftar makanan untuk halaman "Tambah Makanan"
    static async getAllFoods() {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    portion_detail,
                    sugar,
                    carbohydrate,
                    protein,
                    calories
                FROM foods 
                ORDER BY name ASC
            `;
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Mendapatkan detail lengkap makanan untuk halaman "Detail Makanan"
    static async getFoodDetailById(foodId) {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    portion_detail,
                    sugar,
                    carbohydrate,
                    protein,
                    calories,
                    benefits,
                    risks,
                    created_at,
                    updated_at
                FROM foods 
                WHERE id = ?
            `;
            const [rows] = await db.execute(query, [foodId]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Mencari makanan berdasarkan nama (untuk search di halaman tambah makanan)
    static async searchFoodsByName(searchTerm) {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    portion_detail,
                    sugar,
                    carbohydrate,
                    protein,
                    calories
                FROM foods 
                WHERE name LIKE ? 
                ORDER BY name ASC
                LIMIT 50
            `;
            const [rows] = await db.execute(query, [`%${searchTerm}%`]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = FoodModel;