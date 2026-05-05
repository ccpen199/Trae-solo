const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validators');

router.post('/register', registerValidator, authController.register);

router.post('/login', loginValidator, authController.login);

router.get('/me', authenticate, authController.getCurrentUser);

router.put('/profile', authenticate, authController.updateProfile);

router.put('/password', authenticate, authController.updatePassword);

router.post('/become-landlord', authenticate, authController.becomeLandlord);

module.exports = router;
