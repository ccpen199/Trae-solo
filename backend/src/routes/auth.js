const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-code', authController.sendVerificationCode);
router.post('/login/code', authController.verifyCodeAndLogin);
router.post('/login/password', authController.passwordLogin);
router.post('/login/wechat', authController.wechatLogin);
router.post('/login/sso', authController.ssoLogin);
router.post('/register', authController.register);
router.post('/guest/join', authController.guestJoinMeeting);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
