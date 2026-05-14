const express = require('express');
const { createPost, getPosts, toggleLike, getUserProfile } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/', getPosts);
router.post('/like', authenticateToken, toggleLike);
router.get('/user/:userId', getUserProfile);

module.exports = router;
