const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/init');
const { authenticateToken } = require('./auth');

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

const upload = multer({ storage: storage });

router.post('/location', authenticateToken, (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以更新位置' });
  }

  const { lat, lng, online } = req.body;

  db.prepare(`
    UPDATE drivers 
    SET lat = ?, lng = ?, online = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(lat, lng, online !== undefined ? online : 1, req.user.id);

  res.json({ success: true, message: '位置已更新' });
});

router.post('/evidence', authenticateToken, upload.single('file'), (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以上传凭证' });
  }

  const { order_id, type, remark } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  db.prepare(`
    INSERT INTO order_evidences (order_id, driver_id, type, file_url, remark)
    VALUES (?, ?, ?, ?, ?)
  `).run(order_id, req.user.id, type || 'image', fileUrl, remark || '');

  res.json({
    success: true,
    file_url: fileUrl,
    message: '凭证上传成功'
  });
});

router.get('/profile', authenticateToken, (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以查看' });
  }

  const driver = db.prepare(`
    SELECT id, phone, name, id_card, driver_license, vehicle_license,
           vehicle_type, vehicle_number, service_score, order_count, status,
           online, created_at
    FROM drivers WHERE id = ?
  `).get(req.user.id);

  const recentReviews = db.prepare(`
    SELECT r.score, r.content, r.created_at, o.order_no
    FROM reviews r
    JOIN orders o ON r.order_id = o.id
    WHERE r.driver_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(req.user.id);

  res.json({
    driver,
    recent_reviews: recentReviews
  });
});

module.exports = router;
