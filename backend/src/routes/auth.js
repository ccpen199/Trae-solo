const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/sms/send', authController.sendSmsCode);
router.post('/sms/login', authController.smsLogin);
router.post('/password/login', authController.passwordLogin);
router.post('/third-party/login', authController.thirdPartyLogin);
router.post('/bind-phone', authenticateToken, authController.bindPhone);
router.post('/reset-password', authController.resetPassword);
router.get('/user', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
