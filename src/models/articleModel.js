const db = require('../config/db');

// Ambil artikel terbaru per genre (misal 3 terakhir per genre)
async function getLatestArticlesByGenre(genre, limit = 3) {
  const [rows] = await db.execute(`
    SELECT * FROM articles
    WHERE genre = ? AND is_active = 1
    ORDER BY published_at DESC
    LIMIT ?
  `, [genre, limit]);
  return rows;
}

// Ambil semua artikel berdasarkan genre
async function getAllArticlesByGenre(genre) {
  const [rows] = await db.execute(`
    SELECT * FROM articles
    WHERE genre = ? AND is_active = 1
    ORDER BY published_at DESC
  `, [genre]);
  return rows;
}

// Ambil detail artikel berdasarkan id
async function getArticleById(id) {
  const [rows] = await db.execute(`
    SELECT * FROM articles
    WHERE id = ? AND is_active = 1
  `, [id]);
  return rows[0];
}

module.exports = {
  getLatestArticlesByGenre,
  getAllArticlesByGenre,
  getArticleById,
};
