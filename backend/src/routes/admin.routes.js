const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getStats, getUsers, getVideos, deleteVideo } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', authMiddleware, getStats);
router.get('/users', authMiddleware, getUsers);
router.get('/videos', authMiddleware, getVideos);
router.delete('/videos/:id', authMiddleware, deleteVideo);

module.exports = router;
