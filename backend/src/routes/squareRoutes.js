const express = require('express');
const router = express.Router();
const squareController = require('../controllers/squareController');
const { optionalAuth } = require('../middleware/auth');

router.get('/data', optionalAuth, squareController.getSquareData);
router.get('/search', optionalAuth, squareController.search);
router.get('/topics', optionalAuth, squareController.getTrendingTopics);

module.exports = router;
