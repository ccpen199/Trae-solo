const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

router.post('/send-code', authController.sendVerificationCode);
router.post('/login/code', authController.loginWithCode);
router.post('/login/password', authController.loginWithPassword);
router.post('/login/third-party', authController.thirdPartyLogin);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;