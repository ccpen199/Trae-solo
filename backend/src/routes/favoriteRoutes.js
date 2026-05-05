const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, favoriteController.getMyFavorites);
router.post('/:productId', authenticateToken, favoriteController.toggleFavorite);

module.exports = router;
