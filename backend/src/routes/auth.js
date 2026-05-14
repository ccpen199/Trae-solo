const express = require('express');
const { sendCode, login, getCurrentUser, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/send-code', sendCode);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
