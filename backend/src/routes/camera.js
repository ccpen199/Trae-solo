const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { successResponse, errorResponse, handleError } = require('../utils/response');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('请上传图片'));
    }

    const { source_lang = 'auto', target_lang = 'zh', mode = 'photo' } = req.body;

    const mockRecognizedText = mode === 'ar' 
      ? '实时识别的文字内容' 
      : '图片中识别出的文字内容';
    const targetText = `【${source_lang}翻译】${mockRecognizedText}`;

    res.json(successResponse({
      source_text: mockRecognizedText,
      target_text: targetText,
      source_lang,
      target_lang,
      image_url: `/uploads/${req.file.filename}`,
      mode
    }, '识别成功'));
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(400).json(errorResponse('识别失败，请重试'));
  }
});

router.post('/word', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('请上传图片'));
    }

    const mockWords = [
      { word: 'hello', translation: '你好', pronunciation: '/həˈləʊ/' },
      { word: 'world', translation: '世界', pronunciation: '/wɜːld/' },
      { word: 'beautiful', translation: '美丽的', pronunciation: '/ˈbjuːtɪfəl/' }
    ];

    res.json(successResponse({
      words: mockWords,
      image_url: `/uploads/${req.file.filename}`
    }, '取词成功'));
  } catch (error) {
    handleError(res, error, '取词失败');
  }
});

module.exports = router;
