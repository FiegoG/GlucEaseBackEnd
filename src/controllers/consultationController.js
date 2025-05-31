// controllers/consultationController.js
const ConsultationBooking = require('../models/consultationBookingModel');
const { sendConsultationEmail } = require('../utils/sendEmail');

const consultationController = {
  // GET /api/consultation/doctors - Ambil semua dokter
  getAllDoctors: async (req, res) => {
    try {
      const doctors = await ConsultationBooking.getAllDoctors();
      
      res.status(200).json({
        success: true,
        message: 'Doctors retrieved successfully',
        data: doctors
      });
    } catch (error) {
      console.error('Error getting doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // GET /api/consultation/doctor/:id - Ambil detail dokter dan jadwal
  getDoctorDetail: async (req, res) => {
    try {
      const { id } = req.params;
      
      const doctor = await ConsultationBooking.getDoctorById(id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const schedules = await ConsultationBooking.getDoctorSchedules(id);
      
      res.status(200).json({
        success: true,
        message: 'Doctor detail retrieved successfully',
        data: {
          doctor,
          schedules
        }
      });
    } catch (error) {
      console.error('Error getting doctor detail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // POST /api/consultation/validate-coupon - Validasi kupon
  validateCoupon: async (req, res) => {
    try {
      const { coupon_code } = req.body;
      const userId = req.user.id; // dari middleware auth
      
      const coupon = await ConsultationBooking.validateCoupon(userId, coupon_code);
      
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Coupon is valid',
        data: coupon
      });
    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // POST /api/consultation/book - Buat booking konsultasi
  createBooking: async (req, res) => {
    try {
      const {
        doctor_id,
        consultation_date,
        consultation_time,
        payment_method,
        coupon_code,
        booking_notes
      } = req.body;
      
      const userId = req.user.id; // dari middleware auth

      // Validasi input
      if (!doctor_id || !consultation_date || !consultation_time || !payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Ambil detail dokter untuk mendapatkan fee
      const doctor = await ConsultationBooking.getDoctorById(doctor_id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      let discount_amount = 0;
      let couponData = null;

      // Validasi kupon jika ada
      if (coupon_code) {
        couponData = await ConsultationBooking.validateCoupon(userId, coupon_code);
        if (!couponData) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired coupon'
          });
        }

        // Hitung diskon
        if (couponData.discount_type === 'percentage') {
          discount_amount = (doctor.consultation_fee * couponData.discount_value) / 100;
        } else if (couponData.discount_type === 'fixed') {
          discount_amount = couponData.discount_value;
        }
      }

      const total_amount = Math.max(0, doctor.consultation_fee - discount_amount);

      const bookingData = {
        user_id: userId,
        doctor_id,
        consultation_date,
        consultation_time,
        base_fee: doctor.consultation_fee,
        discount_amount,
        total_amount,
        coupon_code,
        payment_method,
        booking_notes
      };

      const bookingId = await ConsultationBooking.createBooking(bookingData);

      // Ambil detail booking yang baru dibuat
      const bookingDetail = await ConsultationBooking.getBookingById(bookingId);

      // Kirim email konfirmasi (dengan Google Meet link)
      await sendConsultationEmail(bookingDetail);

      res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: {
          booking_id: bookingId,
          consultation_date,
          consultation_time,
          doctor_name: doctor.doctor_name,
          total_amount,
          payment_method
        }
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // GET /api/consultation/booking/:id - Ambil detail booking
  getBookingDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await ConsultationBooking.getBookingById(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Pastikan user hanya bisa akses booking miliknya
      if (booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Booking detail retrieved successfully',
        data: booking
      });

    } catch (error) {
      console.error('Error getting booking detail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = consultationController;
