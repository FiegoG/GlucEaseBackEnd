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
      success: true,
      message: "Articles loaded successfully",
      data: {
        kesehatan: healthArticles,
        lifestyle: lifestyleArticles
      }
    });

  } catch (err) {
    console.error("Error in getArticlesHomepage:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load articles from server",
      error: err.message
    });
  }
}

// GET /articles/genre/:genre → tampilkan semua artikel dari genre tertentu
async function getArticlesByGenre(req, res, next) {
  try {
    const genre = req.params.genre;
    if (!['Kesehatan', 'Lifestyle'].includes(genre)) {
      return res.status(400).json({ 
        success: false,
        message: 'Genre tidak valid',
        data: []
      });
    }

    const articles = await getAllArticlesByGenre(genre);
    
    // Format response sesuai dengan ArticleResponse model
    res.json({
      success: true,
      message: `Articles for ${genre} loaded successfully`,
      data: articles
    });
    
  } catch (err) {
    console.error("Error in getArticlesByGenre:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load articles by genre",
      data: [],
      error: err.message
    });
  }
}

// GET /articles/:id → tampilkan detail artikel
async function getArticleDetail(req, res, next) {
  try {
    const article = await getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({
          success: false,
          message: 'Artikel tidak ditemukan',
          data: null // Explicitly null if not found
      });
    }

    // --- Modify this part ---
    res.json({
        success: true,
        message: 'Article detail loaded successfully',
        data: article // Wrap the article object in a 'data' field
    });
    // --- End of modification ---

  } catch (err) {
    console.error("Error in getArticleDetail:", err);
    res.status(500).json({ // Consistent error response
        success: false,
        message: "Failed to load article detail",
        data: null,
        error: err.message
    });
  }
}

module.exports = {
  getArticlesHomepage,
  getArticlesByGenre,
  getArticleDetail
};
