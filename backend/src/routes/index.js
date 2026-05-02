const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/auth/login', authController.login);
router.post('/auth/logout', authMiddleware(), authController.logout);
router.get('/auth/me', authMiddleware(), authController.getCurrentUser);
router.post('/auth/change-password', authMiddleware(), authController.changePassword);

module.exports = router;