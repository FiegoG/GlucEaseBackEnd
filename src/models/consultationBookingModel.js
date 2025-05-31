// models/consultationBookingModel.js
const db = require('../config/db');

const ConsultationBooking = {
  // Ambil semua dokter dengan info dasar
  getAllDoctors: async () => {
    const query = `
      SELECT 
        dp.id,
        dp.user_id,
        u.name as doctor_name,
        dp.expertise,
        dp.bio,
        dp.rating,
        dp.consultation_fee,
        dp.is_active
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.is_active = 1
      ORDER BY dp.rating DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  // Ambil detail dokter berdasarkan ID
  getDoctorById: async (doctorId) => {
    const query = `
      SELECT 
        dp.id,
        dp.user_id,
        u.name as doctor_name,
        dp.expertise,
        dp.bio,
        dp.rating,
        dp.consultation_fee,
        dp.is_active
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = ? AND dp.is_active = 1
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0];
  },

  // Ambil jadwal dokter yang tersedia
  getDoctorSchedules: async (doctorId) => {
    const query = `
      SELECT 
        id,
        doctor_id,
        available_date,
        available_time,
        is_booked
      FROM doctor_schedules 
      WHERE doctor_id = ? 
        AND available_date >= CURDATE() 
        AND is_booked = 0
      ORDER BY available_date ASC, available_time ASC
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows;
  },

  // Buat booking konsultasi
  createBooking: async (bookingData) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert ke consultation_bookings
      const insertBookingQuery = `
        INSERT INTO consultation_bookings 
        (user_id, doctor_id, consultation_date, consultation_time, 
         booking_notes, base_fee, discount_amount, total_amount, 
         coupon_code, payment_status, payment_method, payment_reference, 
         booking_notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [bookingResult] = await connection.execute(insertBookingQuery, [
        bookingData.user_id,
        bookingData.doctor_id,
        bookingData.consultation_date,
        bookingData.consultation_time,
        bookingData.booking_notes || '',
        bookingData.base_fee,
        bookingData.discount_amount || 0,
        bookingData.total_amount,
        bookingData.coupon_code || null,
        'completed', // bypass payment
        bookingData.payment_method,
        `REF-${Date.now()}`, // generate reference
        bookingData.booking_notes || ''
      ]);

      const bookingId = bookingResult.insertId;

      // Update jadwal dokter menjadi booked
      const updateScheduleQuery = `
        UPDATE doctor_schedules 
        SET is_booked = 1 
        WHERE doctor_id = ? AND available_date = ? AND available_time = ?
      `;
      
      await connection.execute(updateScheduleQuery, [
        bookingData.doctor_id,
        bookingData.consultation_date,
        bookingData.consultation_time
      ]);

      // Jika menggunakan kupon, update status kupon
      if (bookingData.coupon_code) {
        const updateCouponQuery = `
          UPDATE user_coupons 
          SET is_used = 1, last_used_at = NOW() 
          WHERE user_id = ? AND coupon_code = ? AND is_used = 0
        `;
        
        await connection.execute(updateCouponQuery, [
          bookingData.user_id,
          bookingData.coupon_code
        ]);
      }

      await connection.commit();
      return bookingId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Validasi kupon
  validateCoupon: async (userId, couponCode) => {
    const query = `
      SELECT 
        uc.coupon_code,
        c.discount_type,
        c.discount_value,
        c.max_usage,
        uc.is_used
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_code = c.code
      WHERE uc.user_id = ? AND uc.coupon_code = ? AND uc.is_used = 0
        AND c.is_active = 1
    `;
    const [rows] = await db.execute(query, [userId, couponCode]);
    return rows[0];
  },

  // Ambil detail booking
  getBookingById: async (bookingId) => {
    const query = `
      SELECT 
        cb.*,
        u.name as doctor_name,
        u.email as doctor_email,
        up.name as patient_name,
        up.email as patient_email
      FROM consultation_bookings cb
      JOIN doctor_profiles dp ON cb.doctor_id = dp.id
      JOIN users u ON dp.user_id = u.id
      JOIN users up ON cb.user_id = up.id
      WHERE cb.id = ?
    `;
    const [rows] = await db.execute(query, [bookingId]);
    return rows[0];
  }
};

module.exports = ConsultationBooking;