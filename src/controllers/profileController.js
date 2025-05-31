const { createUserProfile, updateUserProfile } = require('../models/userProfile'); // Tambahkan updateUserProfile

async function createProfile(req, res, next) {
  try {
    // Ambil user_id dari token yang sudah diverifikasi oleh middleware
    const userId = req.user.userId; // user_id dari token login
    const {
      gender, age, weight, height,
      exercise_intensity, last_sugar_check,
      fasting_behaviour, medical_history
    } = req.body;

    // Pastikan medical_history adalah string JSON jika itu array/objek
    const medicalHistoryString = medical_history ? JSON.stringify(medical_history) : null;

    // Cek apakah profil untuk user_id ini sudah ada.
    // Jika ada, lakukan update. Jika belum, lakukan insert.
    // Ini adalah operasi "upsert".
    await updateUserProfile({ // Menggunakan fungsi updateUserProfile untuk upsert
      user_id: userId, // Gunakan userId dari token
      gender, age, weight, height,
      exercise_intensity, last_sugar_check,
      fasting_behaviour,
      medical_history: medicalHistoryString
    });

    res.status(201).json({ message: 'Data personalisasi berhasil disimpan.' });
  } catch (err) {
    console.error('Error in createProfile:', err); // Log error
    next(err);
  }
}

module.exports = { createProfile };