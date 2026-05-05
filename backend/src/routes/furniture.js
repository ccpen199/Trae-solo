const express = require('express');
const router = express.Router();
const furnitureController = require('../controllers/furnitureController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `search-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

router.get('/', optionalAuth, furnitureController.getFurnitureList);
router.get('/filters', furnitureController.getFilters);
router.get('/:id', optionalAuth, furnitureController.getFurnitureDetail);
router.post('/image-search', authMiddleware, upload.single('image'), furnitureController.imageSearch);

module.exports = router;
