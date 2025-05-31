//src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const db = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const { createUser, findUserByEmail, verifyUser } = require('../models/user');
const { sendVerificationEmail } = require('../utils/mail');
// const { updateUserProfile } = require('../models/profile'); // Hapus baris ini

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Helper function untuk generate JWT tokens
const generateTokens = (userId, email) => {
    const payload = { userId, email };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, province, city, password } = req.body;

        // Validasi input
        if (!name || !email || !province || !city || !password) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter' });
        }

        // Validasi email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format email tidak valid' });
        }

        // Cek apakah email sudah terdaftar
        if (await findUserByEmail(email)) {
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verifyToken = nanoid(32); // Token verifikasi yang lebih panjang

        // Buat user baru
        const userId = await createUser({
            name,
            email,
            province,
            city,
            passwordHash,
            verifyToken
        });

        // Kirim email verifikasi
        await sendVerificationEmail(email, verifyToken);

        res.status(201).json({
            message: 'Akun berhasil dibuat. Email verifikasi telah dikirim ke alamat email Anda.'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server saat mendaftar' });
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Token verifikasi tidak ditemukan' });
        }

        // Cari user berdasarkan token verifikasi
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE verify_token = ? AND is_verified = 0',
            [token]
        );

        if (!rows.length) {
            return res.status(400).json({
                message: 'Token tidak valid atau email sudah diverifikasi'
            });
        }

        const user = rows[0];

        // Update status verifikasi user
        await db.execute(
            'UPDATE users SET is_verified = 1, verify_token = NULL, updated_at = NOW() WHERE id = ?',
            [user.id]
        );

        // --- Perubahan di sini: Mengembalikan user_id (opsional tapi membantu frontend) ---
        res.status(200).json({
            message: 'Email berhasil diverifikasi. Silakan login untuk melengkapi data personalisasi Anda.',
            userId: user.id // Kirim user.id agar frontend tahu user mana yang baru diverifikasi
        });
        // --- Akhir perubahan ---

    } catch (err) {
        console.error('Verify email error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server saat verifikasi email' });
    }
};

// --- Hapus seluruh exports.personalizeProfile dari sini ---
// Karena sekarang ditangani oleh src/controllers/profileController.js
// --- Hapus sampai sini ---

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password harus diisi' });
        }

        // Cari user berdasarkan email
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        const user = rows[0];

        // // Cek apakah email sudah diverifikasi
        // if (!user.is_verified) {
        //     return res.status(401).json({
        //         message: 'Email belum diverifikasi. Silakan cek email Anda untuk verifikasi.',
        //         requireVerification: true
        //     });
        // }

        // Verifikasi password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email);

        // Ambil data profil jika ada
        const [profileRows] = await db.execute('SELECT * FROM user_profiles WHERE user_id = ?', [user.id]);
        const userProfile = profileRows.length > 0 ? profileRows[0] : null;

        // Tentukan apakah user perlu mengisi personalisasi
        const requiresPersonalization = !userProfile || !userProfile.gender || !userProfile.age; // Contoh sederhana, sesuaikan dengan logic Anda
                                                                                              // Misalnya, cek apakah semua kolom personalisasi penting sudah terisi

        // Remove sensitive data dari response
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            province: user.province,
            city: user.city,
            is_verified: user.is_verified,
            created_at: user.created_at,
            profile_completed: !requiresPersonalization // Menandakan apakah personalisasi sudah lengkap
        };

        res.json({
            message: 'Login berhasil',
            user: userResponse,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// ... (methods lainnya seperti resendVerification, refreshToken, logout, forgotPassword, verifyToken, resetPassword tetap sama)
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email harus diisi' });
        }

        // Cari user berdasarkan email
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Email tidak ditemukan' });
        }

        const user = rows[0];

        if (user.is_verified) {
            return res.status(400).json({ message: 'Email sudah diverifikasi' });
        }

        // Generate token verifikasi baru
        const verifyToken = nanoid(32);

        // Update token verifikasi
        await db.execute(
            'UPDATE users SET verify_token = ?, updated_at = NOW() WHERE id = ?',
            [verifyToken, user.id]
        );

        // Kirim email verifikasi ulang
        await sendVerificationEmail(email, verifyToken);

        res.json({ message: 'Email verifikasi telah dikirim ulang' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token tidak ditemukan' });
        }

        // Verifikasi refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        // Cek apakah user masih ada
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);

        if (!rows.length) {
            return res.status(401).json({ message: 'User tidak ditemukan' });
        }

        const user = rows[0];

        // Generate token baru
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email);

        res.json({
            message: 'Token berhasil diperbarui',
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Refresh token tidak valid atau expired' });
        }
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.logout = async (req, res) => {
    try {
        // const { userId } = req.user; // Dari middleware auth
        // Untuk logout sederhana, tidak ada server-side state yang perlu diubah dengan JWT
        res.json({ message: 'Logout berhasil' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email harus diisi' });
        }

        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Email tidak ditemukan' });
        }

        const token = nanoid(6);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

        // Hapus token lama jika ada
        await db.execute('DELETE FROM password_resets WHERE email = ?', [email]);

        // Insert token baru
        await db.execute(
            'INSERT INTO password_resets (email, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
            [email, token, expiresAt]
        );

        await sendEmail(email, 'Kode Reset Password', `Kode verifikasi Anda adalah: ${token}. Kode ini berlaku selama 15 menit.`);

        res.json({ message: 'Kode verifikasi telah dikirim ke email Anda' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ message: 'Email dan token harus diisi' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()',
            [email, token]
        );

        if (!rows.length) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
        }

        res.json({ message: 'Token valid' });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword, confirmPassword } = req.body;

        if (!email || !token || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Password tidak cocok' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()',
            [email, token]
        );

        if (!rows.length) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
            [passwordHash, email]
        );

        // Hapus token reset password
        await db.execute('DELETE FROM password_resets WHERE email = ?', [email]);

        res.json({ message: 'Password berhasil direset. Silakan login kembali.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};