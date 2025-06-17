//src/controllers/sugarIntakeController.js
const SugarIntakeModel = require('../models/sugarIntakeModel');
const FoodModel = require('../models/foodModel');

class SugarTrackerController {
    // [HALAMAN UTAMA] - Mendapatkan data tracker gula darah harian
    static async getDailyTracker(req, res) {
        try {
            const userId = req.user.id;
            const { date } = req.query; // Optional: untuk cek tanggal tertentu

            // Ambil ringkasan harian
            const summary = await SugarIntakeModel.getDailyTrackerSummary(userId, date);
            
            // Ambil daftar makanan yang dikonsumsi
            const foodList = await SugarIntakeModel.getDailyFoodList(userId, date);

            // Hitung status kesehatan dengan handling untuk nilai null/undefined
            const recommendedDailyIntake = 25;
            const totalSugar = summary.total_sugar || 0; // Handle null/undefined
            const totalCalories = summary.total_calories || 0;
            const totalCarbohydrate = summary.total_carbohydrate || 0;
            const totalProtein = summary.total_protein || 0;
            
            const percentage = (totalSugar / recommendedDailyIntake) * 100;
            const healthStatus = SugarIntakeModel.getHealthStatus(totalSugar);

            res.status(200).json({
                success: true,
                message: 'Data tracker harian berhasil diambil',
                data: {
                    date: date || new Date().toISOString().split('T')[0],
                    summary: {
                        total_sugar: parseFloat(totalSugar.toFixed(2)),
                        total_calories: parseFloat(totalCalories.toFixed(2)),
                        total_carbohydrate: parseFloat(totalCarbohydrate.toFixed(2)),
                        total_protein: parseFloat(totalProtein.toFixed(2)),
                        total_food_types: summary.total_food_types || 0,
                        total_records: summary.total_records || 0,
                        recommended_daily_intake: recommendedDailyIntake,
                        percentage_of_recommendation: parseFloat(percentage.toFixed(1)),
                        health_status: healthStatus
                    },
                    consumed_foods: foodList.map(item => ({
                        intake_id: item.intake_id,
                        food_id: item.food_id,
                        food_name: item.food_name,
                        quantity: item.quantity,
                        portion_detail: item.portion_detail,
                        sugar_per_portion: item.sugar,
                        total_sugar: parseFloat((item.total_sugar || 0).toFixed(2)),
                        total_calories: parseFloat((item.total_calories || 0).toFixed(2)),
                        consumed_at: SugarTrackerController.formatDate(item.created_at)
                    }))
                }
            });
        } catch (error) {
            console.error('Error getting daily tracker:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil data tracker harian',
                error: error.message
            });
        }
    }

    static formatDate(dateString) {
        if (!dateString) {
            return '-';
        }

        const date = new Date(dateString);

        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    // [HALAMAN TAMBAH MAKANAN] - Mendapatkan daftar semua makanan
    static async getFoodList(req, res) {
        try {
            const { search } = req.query;
            
            let foods;
            if (search && search.trim() !== '') {
                foods = await FoodModel.searchFoodsByName(search.trim());
            } else {
                foods = await FoodModel.getAllFoods();
            }

            res.status(200).json({
                success: true,
                message: 'Daftar makanan berhasil diambil',
                data: {
                    total_foods: foods.length,
                    search_term: search || null,
                    foods: foods.map(food => ({
                        id: food.id,
                        name: food.name,
                        portion_detail: food.portion_detail,
                        sugar: food.sugar,
                        carbohydrate: food.carbohydrate,
                        protein: food.protein,
                        calories: food.calories
                    }))
                }
            });
        } catch (error) {
            console.error('Error getting food list:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil daftar makanan',
                error: error.message
            });
        }
    }

    // [HALAMAN DETAIL MAKANAN] - Mendapatkan detail lengkap makanan
    static async getFoodDetail(req, res) {
        try {
            const { food_id } = req.params;

            if (!food_id || isNaN(food_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Food ID harus berupa angka yang valid'
                });
            }

            const food = await FoodModel.getFoodDetailById(food_id);

            if (!food) {
                return res.status(404).json({
                    success: false,
                    message: 'Makanan tidak ditemukan'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Detail makanan berhasil diambil',
                data: {
                    id: food.id,
                    name: food.name,
                    portion_detail: food.portion_detail,
                    nutritional_info: {
                        sugar: food.sugar,
                        carbohydrate: food.carbohydrate,
                        protein: food.protein,
                        calories: food.calories
                    },
                    benefits: food.benefits,
                    risks: food.risks,
                    created_at: food.created_at,
                    updated_at: food.updated_at
                }
            });
        } catch (error) {
            console.error('Error getting food detail:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail makanan',
                error: error.message
            });
        }
    }

    // [DARI DETAIL MAKANAN] - Menambahkan makanan ke tracker harian
    static async addFoodToTracker(req, res) {
        try {
            const userId = req.user.id;
            const { food_id } = req.body;

            if (!food_id || isNaN(food_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Food ID harus berupa angka yang valid'
                });
            }

            // Cek apakah makanan exists
            const food = await FoodModel.getFoodDetailById(food_id);
            if (!food) {
                return res.status(404).json({
                    success: false,
                    message: 'Makanan tidak ditemukan'
                });
            }

            // Tambahkan makanan ke tracker
            const intakeId = await SugarIntakeModel.addFoodToTracker(userId, food_id);

            // Ambil data terbaru setelah penambahan
            const updatedSummary = await SugarIntakeModel.getDailyTrackerSummary(userId);

            res.status(201).json({
                success: true,
                message: 'Makanan berhasil ditambahkan ke tracker harian',
                data: {
                    intake_id: intakeId,
                    food_name: food.name,
                    portion_detail: food.portion_detail,
                    added_sugar: food.sugar,
                    added_calories: food.calories,
                    updated_daily_total: {
                        total_sugar: parseFloat((updatedSummary.total_sugar || 0).toFixed(2)),
                        total_calories: parseFloat((updatedSummary.total_calories || 0).toFixed(2))
                    }
                }
            });
        } catch (error) {
            console.error('Error adding food to tracker:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menambahkan makanan ke tracker',
                error: error.message
            });
        }
    }

    // [DARI HALAMAN UTAMA] - Mengubah quantity makanan di tracker
    static async updateFoodQuantity(req, res) {
        try {
            const userId = req.user.id;
            const { intake_id } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity harus lebih dari 0'
                });
            }

            const updated = await SugarIntakeModel.updateFoodQuantity(intake_id, userId, quantity);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Record tidak ditemukan atau bukan milik user'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Quantity makanan berhasil diperbarui'
            });
        } catch (error) {
            console.error('Error updating food quantity:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal memperbarui quantity makanan',
                error: error.message
            });
        }
    }

    // [DARI HALAMAN UTAMA] - Menghapus makanan dari tracker
    static async removeFoodFromTracker(req, res) {
        try {
            const userId = req.user.id;
            const { intake_id } = req.params;

            const removed = await SugarIntakeModel.removeFoodFromTracker(intake_id, userId);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Record tidak ditemukan atau bukan milik user'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Makanan berhasil dihapus dari tracker'
            });
        } catch (error) {
            console.error('Error removing food from tracker:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menghapus makanan dari tracker',
                error: error.message
            });
        }
    }
}

module.exports = SugarTrackerController;