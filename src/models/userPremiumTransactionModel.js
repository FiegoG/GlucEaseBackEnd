// src/models/userPremiumTransactionModel.js
const db = require('../config/db'); // Asumsi lokasi file koneksi DB Anda

const UserPremiumTransaction = {
    create: async (userId, packageId, amount, paymentMethod = 'bypassed', paymentStatus = 'completed', paymentReference = 'BYPASS_SYSTEM') => {
        const transactionDate = new Date();
        const [result] = await db.query(
            'INSERT INTO user_premium_transactions (user_id, package_id, transaction_amount, transaction_date, payment_method, payment_status, payment_reference, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [userId, packageId, amount, transactionDate, paymentMethod, paymentStatus, paymentReference]
        );
        return result.insertId;
    }
};

module.exports = UserPremiumTransaction;