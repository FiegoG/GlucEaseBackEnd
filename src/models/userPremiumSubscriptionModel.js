// src/models/userPremiumSubscriptionModel.js
const db = require('../config/db'); // Asumsi lokasi file koneksi DB Anda

const UserPremiumSubscription = {
    createSubscription: async (userId, packageId, transactionId, startDate, endDate) => {
        // Nonaktifkan langganan aktif sebelumnya jika ada
        await db.query('UPDATE user_premium_subscriptions SET is_active = 0, updated_at = NOW() WHERE user_id = ? AND is_active = 1', [userId]);

        const [result] = await db.query(
            'INSERT INTO user_premium_subscriptions (user_id, package_id, transaction_id, start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())',
            [userId, packageId, transactionId, startDate, endDate]
        );
        return result.insertId;
    },
    getActiveSubscriptionByUser: async (userId) => {
        const [rows] = await db.query(
            `SELECT ups.*, pp.package_name
             FROM user_premium_subscriptions ups
             JOIN premium_packacges pp ON ups.package_id = pp.id
             WHERE ups.user_id = ? AND ups.is_active = 1 AND ups.end_date >= CURDATE()`,
            [userId]
        );
        return rows[0];
    },
    cancelSubscription: async (userId) => {
        // Hanya menonaktifkan, tidak menghapus record untuk histori
        const [result] = await db.query(
            'UPDATE user_premium_subscriptions SET is_active = 0, end_date = CURDATE(), updated_at = NOW() WHERE user_id = ? AND is_active = 1',
            [userId]
        );
        return result.affectedRows > 0;
    },
    // Fungsi ini bisa juga di userModel.js jika Anda ingin update kolom 'role' di tabel 'users'
    updateUserToPremium: async (userId) => {
        // Contoh: Jika Anda punya kolom `is_premium` atau `role` di tabel `users`
        // await db.query('UPDATE users SET role = \'premium_user\', updated_at = NOW() WHERE id = ?', [userId]);
        // Untuk saat ini, status premium ditentukan oleh adanya record aktif di user_premium_subscriptions
        console.log(`User ${userId} status premium kini diatur melalui tabel user_premium_subscriptions.`);
    },
    revertUserToRegular: async (userId) => {
        // Contoh: Jika Anda punya kolom `is_premium` atau `role` di tabel `users`
        // await db.query('UPDATE users SET role = \'user\', updated_at = NOW() WHERE id = ?', [userId]);
        console.log(`User ${userId} status premium kini dinonaktifkan melalui tabel user_premium_subscriptions.`);
    }
};

module.exports = UserPremiumSubscription;