const express = require('express');
const router = express.Router();
const { sendVerificationCode, register, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-code', sendVerificationCode);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
