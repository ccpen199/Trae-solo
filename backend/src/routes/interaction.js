const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

router.post('/favorites', authMiddleware, interactionController.toggleFavorite);
router.get('/favorites', authMiddleware, interactionController.getFavorites);

router.post('/follows', authMiddleware, interactionController.toggleFollow);

router.get('/messages', authMiddleware, interactionController.getMessages);
router.post('/messages', authMiddleware, interactionController.sendMessage);

router.get('/questions', optionalAuth, interactionController.getQuestions);
router.get('/questions/:id', interactionController.getQuestionDetail);
router.post('/questions', authMiddleware, interactionController.createQuestion);
router.post('/answers', authMiddleware, interactionController.createAnswer);

module.exports = router;
