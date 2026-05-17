const express = require('express');
const { sendCode, register, login, resetPassword } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/send-code', sendCode);
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

module.exports = router;
