const express = require('express');
const { createPost, getPosts, getFollowPosts, likePost, unlikePost, addComment, getComments, followUser, unfollowUser } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/', authenticateToken, getPosts);
router.get('/follow', authenticateToken, getFollowPosts);
router.post('/:postId/like', authenticateToken, likePost);
router.delete('/:postId/like', authenticateToken, unlikePost);
router.post('/:postId/comments', authenticateToken, addComment);
router.get('/:postId/comments', authenticateToken, getComments);
router.post('/follow/:userId', authenticateToken, followUser);
router.delete('/follow/:userId', authenticateToken, unfollowUser);

module.exports = router;
