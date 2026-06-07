const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { getServiceUserId } = require('../utils/accountContext');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('只允许上传图片文件'));
  }
});

function mockOCR(imagePath) {
  const mockReadings = [2468.5, 2472.3, 2475.8, 2480.1, 2485.6];
  const reading = mockReadings[Math.floor(Math.random() * mockReadings.length)];
  return {
    reading_value: reading,
    meter_no: 'MTR000001',
    confidence: 0.85 + Math.random() * 0.15,
    digits: [
      { digit: Math.floor(reading / 1000) % 10, confidence: 0.95 },
      { digit: Math.floor(reading / 100) % 10, confidence: 0.92 },
      { digit: Math.floor(reading / 10) % 10, confidence: 0.88 },
      { digit: Math.floor(reading) % 10, confidence: 0.90 },
      { digit: Math.floor(reading * 10) % 10, confidence: 0.82 }
    ]
  };
}

router.post('/ocr', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传表具照片' });
    }

    const serviceUserId = getServiceUserId(req);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    if (!meter) {
      return res.status(404).json({ error: '未找到关联表具信息' });
    }

    const ocrResult = mockOCR(req.file.path);
    const today = new Date();
    const billingCycle = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const result = db.prepare(`INSERT INTO meter_readings 
      (user_id, meter_id, reading_value, reading_type, image_path, ocr_result, reading_date, billing_cycle, status)
      VALUES (?, ?, ?, 'ocr', ?, ?, ?, ?, 'pending')`).run(
      serviceUserId,
      meter.id,
      ocrResult.reading_value,
      `/uploads/${req.file.filename}`,
      JSON.stringify(ocrResult),
      today.toISOString().split('T')[0],
      billingCycle
    );

    db.prepare('UPDATE meters SET last_read_date = ?, last_read_value = ? WHERE id = ?').run(
      today.toISOString().split('T')[0],
      ocrResult.reading_value,
      meter.id
    );

    res.json({
      id: result.lastInsertRowid,
      reading_value: ocrResult.reading_value,
      meter_no: meter.meter_no,
      reading_date: today.toISOString().split('T')[0],
      image_path: `/uploads/${req.file.filename}`,
      ocr_result: ocrResult,
      status: 'pending',
      message: 'OCR识别成功，请确认读数'
    });
  } catch (err) {
    console.error('OCR报数错误:', err);
    res.status(500).json({ error: err.message || 'OCR识别失败' });
  }
});

router.post('/manual', authenticateToken, (req, res) => {
  try {
    const { reading_value, reading_date, remark } = req.body;

    if (!reading_value || reading_value <= 0) {
      return res.status(400).json({ error: '请输入有效的读数' });
    }

    const serviceUserId = getServiceUserId(req);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    if (!meter) {
      return res.status(404).json({ error: '未找到关联表具信息' });
    }

    if (reading_value < meter.last_read_value) {
      return res.status(400).json({ error: `读数不能小于上次读数 ${meter.last_read_value}` });
    }

    const today = new Date();
    const useDate = reading_date || today.toISOString().split('T')[0];
    const billingCycle = `${new Date(useDate).getFullYear()}${String(new Date(useDate).getMonth() + 1).padStart(2, '0')}`;

    const result = db.prepare(`INSERT INTO meter_readings 
      (user_id, meter_id, reading_value, reading_type, reading_date, billing_cycle, status)
      VALUES (?, ?, ?, 'manual', ?, ?, 'pending')`).run(
      serviceUserId,
      meter.id,
      reading_value,
      useDate,
      billingCycle
    );

    db.prepare('UPDATE meters SET last_read_date = ?, last_read_value = ? WHERE id = ?').run(
      useDate,
      reading_value,
      meter.id
    );

    res.json({
      id: result.lastInsertRowid,
      reading_value,
      meter_no: meter.meter_no,
      reading_date: useDate,
      status: 'pending',
      message: '人工报数提交成功'
    });
  } catch (err) {
    console.error('人工报数错误:', err);
    res.status(500).json({ error: '报数提交失败' });
  }
});

router.get('/my-readings', authenticateToken, (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const readings = db.prepare(`
      SELECT mr.*, m.meter_no, m.location 
      FROM meter_readings mr 
      LEFT JOIN meters m ON mr.meter_id = m.id 
      WHERE mr.user_id = ? 
      ORDER BY mr.reading_date DESC, mr.id DESC 
      LIMIT ? OFFSET ?`).all(getServiceUserId(req), parseInt(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM meter_readings WHERE user_id = ?').get(getServiceUserId(req)).count;

    res.json({
      list: readings.map(r => ({
        ...r,
        ocr_result: r.ocr_result ? JSON.parse(r.ocr_result) : null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error('获取读数记录错误:', err);
    res.status(500).json({ error: '获取读数记录失败' });
  }
});

router.get('/current', authenticateToken, (req, res) => {
  try {
    const serviceUserId = getServiceUserId(req);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    if (!meter) {
      return res.status(404).json({ error: '未找到表具信息' });
    }

    const lastReading = db.prepare(`SELECT * FROM meter_readings 
      WHERE user_id = ? AND status = 'verified' 
      ORDER BY reading_date DESC LIMIT 1`).get(serviceUserId);

    res.json({
      meter,
      last_reading: lastReading,
      can_submit: true
    });
  } catch (err) {
    console.error('获取当前读数错误:', err);
    res.status(500).json({ error: '获取表具信息失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const reading = db.prepare(`
      SELECT mr.*, m.meter_no, m.location, u.real_name
      FROM meter_readings mr
      LEFT JOIN meters m ON mr.meter_id = m.id
      LEFT JOIN users u ON mr.user_id = u.id
      WHERE mr.id = ?`).get(id);

    if (!reading) {
      return res.status(404).json({ error: '读数记录不存在' });
    }

    if (reading.user_id !== getServiceUserId(req) && !['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ error: '无权查看此读数记录' });
    }

    res.json({
      ...reading,
      ocr_result: reading.ocr_result ? JSON.parse(reading.ocr_result) : null
    });
  } catch (err) {
    console.error('获取读数详情错误:', err);
    res.status(500).json({ error: '获取读数详情失败' });
  }
});

router.put('/:id/confirm', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { reading_value } = req.body;

    const reading = db.prepare('SELECT * FROM meter_readings WHERE id = ? AND user_id = ?').get(id, getServiceUserId(req));
    if (!reading) {
      return res.status(404).json({ error: '读数记录不存在' });
    }

    db.prepare('UPDATE meter_readings SET reading_value = ?, status = ? WHERE id = ?').run(
      reading_value || reading.reading_value,
      'verified',
      id
    );

    res.json({ message: '读数已确认' });
  } catch (err) {
    console.error('确认读数错误:', err);
    res.status(500).json({ error: '确认失败' });
  }
});

module.exports = router;
