const express = require('express');
const articleController = require('../controllers/articleController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, articleController.getList);
router.get('/:id', optionalAuth, articleController.getById);
router.post('/', authMiddleware, articleController.create);
router.post('/:id/like', authMiddleware, articleController.like);
router.post('/:id/favorite', authMiddleware, articleController.toggleFavorite);

module.exports = router;
