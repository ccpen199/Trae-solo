const express = require('express');
const { getSoulTestQuestions, submitSoulTest, getRecommendedUsers, createMatch } = require('../controllers/matchController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/soul-test/questions', authenticateToken, getSoulTestQuestions);
router.post('/soul-test/submit', authenticateToken, submitSoulTest);
router.get('/recommendations', authenticateToken, getRecommendedUsers);
router.post('/create', authenticateToken, createMatch);

module.exports = router;
