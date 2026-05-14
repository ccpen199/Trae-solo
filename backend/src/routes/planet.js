const express = require('express');
const { getTests, submitTest, getPlanets, getPlanetUsers, randomMatch, getUserProfile } = require('../controllers/planetController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/tests', authenticateToken, getTests);
router.post('/tests/submit', authenticateToken, submitTest);
router.get('/planets', authenticateToken, getPlanets);
router.get('/planets/:planetId/users', authenticateToken, getPlanetUsers);
router.post('/match/random', authenticateToken, randomMatch);
router.get('/users/:userId', authenticateToken, getUserProfile);

module.exports = router;
