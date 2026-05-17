import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getMediaList, uploadMedia, getMediaDetail, updateMedia, deleteMedia, toggleFavorite } from '../controllers/media.controller';
import auth from '../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600')
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片和视频文件'));
    }
  }
});

router.get('/', auth, getMediaList);
router.post('/upload', auth, upload.single('file'), uploadMedia);
router.get('/:id', auth, getMediaDetail);
router.put('/:id', auth, updateMedia);
router.delete('/:id', auth, deleteMedia);
router.post('/:id/favorite', auth, toggleFavorite);

export default router;
