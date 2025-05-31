const {
  getLatestArticlesByGenre,
  getAllArticlesByGenre,
  getArticleById
} = require('../models/articleModel');

// GET /articles → tampilkan artikel terbaru untuk masing-masing genre
async function getArticlesHomepage(req, res, next) {
  try {
    const healthArticles = await getLatestArticlesByGenre('Kesehatan');
    const lifestyleArticles = await getLatestArticlesByGenre('Lifestyle');

    res.json({
      kesehatan: healthArticles,
      lifestyle: lifestyleArticles
    });
  } catch (err) {
    next(err);
  }
}

// GET /articles/genre/:genre → tampilkan semua artikel dari genre tertentu
async function getArticlesByGenre(req, res, next) {
  try {
    const genre = req.params.genre;
    if (!['Kesehatan', 'Lifestyle'].includes(genre)) {
      return res.status(400).json({ error: 'Genre tidak valid' });
    }

    const articles = await getAllArticlesByGenre(genre);
    res.json(articles);
  } catch (err) {
    next(err);
  }
}

// GET /articles/:id → tampilkan detail artikel
async function getArticleDetail(req, res, next) {
  try {
    const article = await getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json(article);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getArticlesHomepage,
  getArticlesByGenre,
  getArticleDetail
};
