const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, commentController.getComments);
router.get('/weibo', optionalAuth, commentController.getWeiboComments);
router.get('/:id', optionalAuth, commentController.getCommentById);

router.post('/', protect, commentController.createComment);
router.put('/:id', protect, commentController.updateComment);
router.delete('/:id', protect, commentController.deleteComment);

router.post('/:id/like', protect, commentController.likeComment);

module.exports = router;
