const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
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

const upload = multer({ storage });

router.get('/files', authenticateToken, (req, res) => {
  const { parent_id = 0 } = req.query;
  const files = db.prepare('SELECT * FROM cloud_files WHERE user_id = ? AND parent_id = ? ORDER BY created_at DESC').all(req.user.userId, parent_id);
  res.json({ files });
});

router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未选择文件' });
  }

  const { parent_id = 0 } = req.body;
  const fileId = db.prepare(`
    INSERT INTO cloud_files (user_id, filename, file_path, file_size, file_type, parent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.user.userId,
    req.file.originalname,
    req.file.path,
    req.file.size,
    req.file.mimetype,
    parent_id
  ).lastInsertRowid;

  const file = db.prepare('SELECT * FROM cloud_files WHERE id = ?').get(fileId);
  res.json({ file });
});

router.get('/tools', authenticateToken, (req, res) => {
  const tools = [
    { id: 1, name: '文件解压缩', icon: '📦', desc: '支持zip、rar等格式' },
    { id: 2, name: '格式转换', icon: '🔄', desc: '文档、图片格式转换' },
    { id: 3, name: 'PDF处理', icon: '📄', desc: 'PDF合并、分割、加密' },
    { id: 4, name: '图片压缩', icon: '🖼️', desc: '无损压缩图片大小' }
  ];

  const scanTools = [
    { id: 1, name: '文档扫描', icon: '📷', desc: '高清扫描文档' },
    { id: 2, name: '身份证扫描', icon: '🪪', desc: '身份证正反面合成' },
    { id: 3, name: '手写识别', icon: '✍️', desc: '手写文字转电子档' }
  ];

  res.json({ tools, scanTools });
});

router.get('/documents', authenticateToken, (req, res) => {
  const documents = [
    { id: 1, name: '我的笔记', icon: '📝', updated_at: '2024-01-15' },
    { id: 2, name: '工作文档', icon: '📊', updated_at: '2024-01-14' },
    { id: 3, name: '学习资料', icon: '📚', updated_at: '2024-01-13' }
  ];
  res.json({ documents });
});

router.get('/recent', authenticateToken, (req, res) => {
  const files = db.prepare('SELECT * FROM cloud_files WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.userId);
  res.json({ files });
});

router.get('/vip', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let isVip = false;
  if (token) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT is_vip FROM users WHERE id = ?').get(decoded.userId);
      isVip = user && user.is_vip;
    } catch (e) {}
  }

  const benefits = [
    { id: 1, name: '10TB云存储空间', icon: '☁️', available: isVip },
    { id: 2, name: '极速下载', icon: '⚡', available: isVip },
    { id: 3, name: '视频倍速播放', icon: '▶️', available: isVip },
    { id: 4, name: '文件历史版本', icon: '📜', available: isVip }
  ];

  res.json({ isVip, benefits });
});

module.exports = router;
