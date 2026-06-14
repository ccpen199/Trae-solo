const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/verify', auth, userController.verify);
router.get('/list', auth, requireRole('admin'), userController.getList);

module.exports = router;
