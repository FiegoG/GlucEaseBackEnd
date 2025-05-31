const nodemailer = require('nodemailer');
const GoogleMeetService = require('./googleMeetUtils');

module.exports = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
     service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

const sendConsultationEmail = async (bookingDetail) => {
  try {
    // Generate Google Meet link (dalam implementasi nyata, gunakan Google Meet API)
    const meetLink = `https://meet.google.com/xxx-xxxx-xxx`; // placeholder

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingDetail.patient_email,
      subject: 'Konfirmasi Booking Konsultasi - Glucease',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">Konfirmasi Booking Konsultasi</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detail Konsultasi:</h3>
            <p><strong>Dokter:</strong> ${bookingDetail.doctor_name}</p>
            <p><strong>Tanggal:</strong> ${bookingDetail.consultation_date}</p>
            <p><strong>Waktu:</strong> ${bookingDetail.consultation_time}</p>
            <p><strong>Total Pembayaran:</strong> Rp${bookingDetail.total_amount.toLocaleString()}</p>
            <p><strong>Metode Pembayaran:</strong> ${bookingDetail.payment_method}</p>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Link Google Meet:</h3>
            <p><a href="${meetLink}" style="color: #28a745; text-decoration: none;">${meetLink}</a></p>
            <p><small>Silakan bergabung pada waktu yang telah ditentukan.</small></p>
          </div>

          <p>Terima kasih telah menggunakan layanan Glucease!</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Consultation email sent successfully');
  } catch (error) {
    console.error('Error sending consultation email:', error);
  }
};

module.exports = { sendConsultationEmail };