const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getArticles, getArticleBySlug } = require('../controllers/articleController');

router.get('/', optionalAuth, getArticles);
router.get('/:slug', optionalAuth, getArticleBySlug);

module.exports = router;
