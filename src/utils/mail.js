// src/utils/mail.js
const nodemailer = require('nodemailer');
const { sendEmail } = require('./sendEmail'); // Asumsikan ada fungsi sendEmail di emailService.js
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:     process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(to, token) {
  const link = `glueeaseapp://verify-email?token=${token}`; // Deep Link to app
  const subject = 'Verifikasi Email GluEase';
  const html = `
    <p>Terima kasih telah mendaftar di GluEase!</p>
    <p>Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
    <a href="${link}" style="padding: 10px 15px; background-color: #007bff; color: white; border-radius: 5px;">Verifikasi Email</a>
    <p>Atau salin dan tempel link ini: ${link}</p>
  `;

  // Gunakan nodemailer, sendGrid, atau service email lain
  await sendEmail(to, subject, html);
}

module.exports = { sendVerificationEmail };
