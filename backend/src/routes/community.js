const express = require('express');
const {
  getCategories,
  getPosts,
  getPostDetail,
  createPost,
  createReply,
  likePost,
  getMyPosts
} = require('../controllers/community');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/posts', getPosts);
router.get('/posts/my', authenticateToken, getMyPosts);
router.get('/posts/:id', getPostDetail);
router.post('/posts', authenticateToken, createPost);
router.post('/posts/replies', authenticateToken, createReply);
router.post('/posts/like', authenticateToken, likePost);

module.exports = router;
