const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getCircles, getCircleDetail, getCirclePosts, createPost, getExplorePosts } = require('../controllers/circleController');

router.get('/', getCircles);
router.get('/explore', getExplorePosts);
router.get('/:id', getCircleDetail);
router.get('/:id/posts', getCirclePosts);
router.post('/posts', authenticateToken, createPost);

module.exports = router;