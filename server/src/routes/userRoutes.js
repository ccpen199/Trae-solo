const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/search', userController.searchUsers);

router.get('/favorites', authenticate, userController.getUserFavorites);
router.delete('/favorites/:id', authenticate, userController.removeFavorite);

router.get('/:id', optionalAuth, userController.getUserProfile);

router.put('/profile', authenticate, userController.updateProfile);

router.get('/:id/resources', userController.getUserResources);

module.exports = router;
