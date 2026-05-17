const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostDetail, toggleLike, addComment, getMyPosts } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createPost);
router.get('/', getPosts);
router.get('/my', authenticateToken, getMyPosts);
router.get('/:id', getPostDetail);
router.post('/:id/like', authenticateToken, toggleLike);
router.post('/:id/comments', authenticateToken, addComment);

module.exports = router;
