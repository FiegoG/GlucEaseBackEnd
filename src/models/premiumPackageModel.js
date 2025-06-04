// src/models/premiumPackageModel.js
const db = require('../config/db'); // Asumsi lokasi file koneksi DB Anda

const PremiumPackage = {
    getAll: async () => {
        const [rows] = await db.query('SELECT id, package_name, duration_monts, price, description FROM premium_packacges WHERE is_active = 1');
        return rows;
    },
    getById: async (id) => {
        const [rows] = await db.query('SELECT id, package_name, duration_monts, price, description FROM premium_packacges WHERE id = ? AND is_active = 1', [id]);
        return rows[0];
    }
};

module.exports = PremiumPackage;