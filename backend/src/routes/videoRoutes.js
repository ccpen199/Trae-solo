const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideo, getUserVideos, reviewVideo, getPendingVideos } = require('../controllers/videoController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持视频文件格式'));
    }
  }
});

router.get('/stream/:id', getVideo);
router.get('/my', authenticateToken, getUserVideos);
router.post('/upload', authenticateToken, upload.single('video'), uploadVideo);

router.get('/pending', authenticateToken, requireRole(['admin']), getPendingVideos);
router.put('/:id/review', authenticateToken, requireRole(['admin']), reviewVideo);

module.exports = router;
