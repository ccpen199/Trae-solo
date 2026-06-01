const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;