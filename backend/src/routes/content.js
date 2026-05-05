const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

router.get('/articles', optionalAuth, contentController.getArticleList);
router.get('/articles/:id', optionalAuth, contentController.getArticleDetail);

router.get('/comments/:target_type/:target_id', contentController.getComments);
router.post('/comments', authMiddleware, contentController.addComment);

module.exports = router;
