const express = require('express');
const {
  getArticlesHomepage,
  getArticlesByGenre,
  getArticleDetail
} = require('../controllers/articleController');

const router = express.Router();

router.get('/', getArticlesHomepage);
router.get('/genre/:genre', getArticlesByGenre);
router.get('/:id', getArticleDetail);

module.exports = router;
