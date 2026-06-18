const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.validate, authController.login);
router.post('/register', authController.validate, authController.register);
router.get('/profile', auth(), authController.getCurrentUser);
router.put('/profile', auth(), authController.updateProfile);

module.exports = router;
