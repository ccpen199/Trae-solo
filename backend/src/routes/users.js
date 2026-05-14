const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', optionalAuth, userController.getProfile);
router.get('/:id/follow', authMiddleware, userController.toggleFollowUser);
router.get('/me/questions', authMiddleware, userController.getMyQuestions);
router.get('/me/answers', authMiddleware, userController.getMyAnswers);
router.get('/me/articles', authMiddleware, userController.getMyArticles);
router.get('/me/favorites', authMiddleware, userController.getMyFavorites);
router.get('/me/followings', authMiddleware, userController.getMyFollowings);
router.get('/me/followers', authMiddleware, userController.getMyFollowers);

module.exports = router;
