const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

router.get('/post/:postId', optionalAuthenticate, commentController.getComments);
router.post('/post/:postId', authenticate, commentController.createComment);
router.post('/:id/like', authenticate, commentController.likeComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
