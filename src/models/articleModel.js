const db = require('../config/db');

function mapArticleRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        genre: row.genre,
        author: row.author, // <--- Langsung ambil dari kolom 'author' di tabel articles
        image_url: row.image_url,
        published_at: row.published_at,
        created_at: row.created_at,
        updated_at: row.updated_at
        // is_active (biasanya tidak dikirim ke frontend, tapi bisa jika diperlukan)
    };
}

// Ambil artikel terbaru per genre (misal 3 terakhir per genre)
async function getLatestArticlesByGenre(genre, limit = 3) {
    const [rows] = await db.execute(`
        SELECT * -- Pilih semua kolom, termasuk 'author'
        FROM articles
        WHERE genre = ? AND is_active = 1
        ORDER BY published_at DESC
        LIMIT ?
    `, [genre, limit]);
    return rows.map(mapArticleRow); // Panggil helper untuk memformat
}

// Ambil semua artikel berdasarkan genre
async function getAllArticlesByGenre(genre) {
    const [rows] = await db.execute(`
        SELECT * -- Pilih semua kolom, termasuk 'author'
        FROM articles
        WHERE genre = ? AND is_active = 1
        ORDER BY published_at DESC
    `, [genre]);
    return rows.map(mapArticleRow); // Panggil helper untuk memformat
}

// Ambil detail artikel berdasarkan id
async function getArticleById(id) {
    const [rows] = await db.execute(`
        SELECT * -- Pilih semua kolom, termasuk 'author'
        FROM articles
        WHERE id = ? AND is_active = 1
    `, [id]);
    
    // Periksa apakah artikel ditemukan sebelum memformat
    if (rows.length > 0) {
        return mapArticleRow(rows[0]); // Panggil helper untuk memformat satu baris
    }
    return null; // Kembalikan null jika artikel tidak ditemukan
}

module.exports = {
  getLatestArticlesByGenre,
  getAllArticlesByGenre,
  getArticleById,
};
