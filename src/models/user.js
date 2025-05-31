// src/models/User.js
const db = require('../config/db');

async function createUser({ name, email, province, city, passwordHash, verifyToken }) {
  const [result] = await db.execute(`
    INSERT INTO users (name,email,province,city,password,login_method,created_at,updated_at,verify_token)
    VALUES (?, ?, ?, ?, ?, 'email', NOW(), NOW(), ?)
  `, [name,email,province,city,passwordHash,verifyToken]);
  return result.insertId;
}

async function findUserByEmail(email) {
  const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
  return rows[0];
}

async function verifyUser(token) {
  const [result] = await db.execute(`UPDATE users SET email_verified_at = NOW(), verify_token = NULL WHERE verify_token = ?`, [token]);
  return result.affectedRows > 0;
}


module.exports = { createUser, findUserByEmail, verifyUser };
