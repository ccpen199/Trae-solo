const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  getRecommendVideos,
  getNearbyVideos,
  getFollowingVideos,
  getVideoById,
  uploadVideo,
  getUserVideos,
  likeVideo,
  unlikeVideo
} = require('../controllers/video.controller');
const { getComments, createComment, deleteComment } = require('../controllers/comment.controller');

const router = express.Router();

router.get('/recommend', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
}, getRecommendVideos);

router.get('/nearby', getNearbyVideos);
router.get('/following', authMiddleware, getFollowingVideos);
router.get('/user/:userId', getUserVideos);

router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
}, getVideoById);

router.post('/', authMiddleware, upload.single('video'), uploadVideo);
router.post('/:id/like', authMiddleware, likeVideo);
router.delete('/:id/like', authMiddleware, unlikeVideo);

router.get('/:videoId/comments', getComments);
router.post('/:videoId/comments', authMiddleware, createComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
