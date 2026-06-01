const express = require('express');
const router = express.Router();
const { login, register, checkNickname, sendSmsCode, oauthLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/check-nickname/:nickname', checkNickname);
router.post('/send-sms-code', sendSmsCode);
router.post('/oauth-login', oauthLogin);

module.exports = router;