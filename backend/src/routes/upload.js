const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadsDir = path.join(__dirname, '../../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().split('T')[0];
    const dayDir = path.join(uploadsDir, today);
    if (!fs.existsSync(dayDir)) {
      fs.mkdirSync(dayDir, { recursive: true });
    }
    cb(null, dayDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi', '.mov', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const relativePath = path.relative(uploadsDir, req.file.path);
    const url = `/uploads/${relativePath.split(path.sep).join('/')}`;

    res.json({
      success: true,
      data: {
        original_name: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        url: url,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '文件上传失败'
    });
  }
});

router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files.map(file => {
      const relativePath = path.relative(uploadsDir, file.path);
      const url = `/uploads/${relativePath.split(path.sep).join('/')}`;
      return {
        original_name: file.originalname,
        filename: file.filename,
        path: file.path,
        url: url,
        size: file.size
      };
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '文件上传失败'
    });
  }
});

router.post('/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传视频'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const videoExts = ['.mp4', '.avi', '.mov'];
    
    if (!videoExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: '只支持 mp4、avi、mov 格式的视频文件'
      });
    }

    if (req.file.size > 30 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: '视频大小不能超过 30MB'
      });
    }

    const relativePath = path.relative(uploadsDir, req.file.path);
    const url = `/uploads/${relativePath.split(path.sep).join('/')}`;

    res.json({
      success: true,
      data: {
        original_name: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        url: url,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('视频上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '视频上传失败'
    });
  }
});

module.exports = router;
