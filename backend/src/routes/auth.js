const express = require('express');
const { login, getCurrentUser, getAllUsers } = require('../controllers/authController');
const { authenticateToken, requireRoles, logAudit } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);

router.get('/me', authenticateToken, getCurrentUser);

router.get('/users', authenticateToken, requireRoles('platform_engineer', 'security_admin'), getAllUsers);

module.exports = router;
