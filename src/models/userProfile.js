const db = require('../config/db');

async function upsertUserProfile({
  user_id, gender, age, weight, height,
  exercise_intensity, last_sugar_check,
  fasting_behaviour, medical_history // medical_history diharapkan sudah dalam bentuk JSON string
}) {
  try {
    await db.execute(`
      INSERT INTO user_profiles
        (user_id, gender, age, weight, height,
        exercise_intensity, last_sugar_check,
        fasting_behaviour, medical_history,
        created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())
      ON DUPLICATE KEY UPDATE
        gender = VALUES(gender),
        age = VALUES(age),
        weight = VALUES(weight),
        height = VALUES(height),
        exercise_intensity = VALUES(exercise_intensity),
        last_sugar_check = VALUES(last_sugar_check),
        fasting_behaviour = VALUES(fasting_behaviour),
        medical_history = VALUES(medical_history),
        updated_at = NOW()
    `, [user_id, gender, age, weight, height, exercise_intensity, last_sugar_check, fasting_behaviour, medical_history]);
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
}

// Anda bisa tetap mempertahankan createUserProfile jika diperlukan untuk kasus insert murni,
// tapi untuk flow personalisasi, upsert lebih umum.
// Jika ingin memisahkan:
// async function createUserProfile(...) { ...INSERT... }
// async function updateExistingUserProfile(...) { ...UPDATE... }

module.exports = {
  // createUserProfile, // Hapus atau biarkan tergantung kebutuhan Anda
  updateUserProfile: upsertUserProfile // Rename agar lebih jelas bahwa ini adalah upsert
};