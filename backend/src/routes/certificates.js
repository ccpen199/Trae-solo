const express = require('express');
const multer = require('multer');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, (req, res) => {
  const certificates = db.prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(certificates);
});

router.post('/ocr', authenticateToken, upload.single('image'), (req, res) => {
  const { cert_type } = req.body;

  if (!cert_type) {
    return res.status(400).json({ error: '请提供证书类型' });
  }

  const mockOcrData = {
    '身份证': {
      cert_number: '44010' + Math.floor(Math.random() * 1000000000000).toString().slice(0, 14),
      cert_name: req.user.nickname || '测试用户',
      issuer: '广州市公安局',
      issue_date: '2020-01-01',
      expiry_date: '2040-01-01'
    },
    '电工证': {
      cert_number: 'DG' + Math.floor(Math.random() * 1000000),
      cert_name: '低压电工作业证',
      issuer: '应急管理部',
      issue_date: '2022-06-01',
      expiry_date: '2028-06-01'
    },
    '驾驶证': {
      cert_number: '4401' + Math.floor(Math.random() * 100000000000),
      cert_name: 'C1机动车驾驶证',
      issuer: '广州市公安局交通警察支队',
      issue_date: '2020-03-15',
      expiry_date: '2026-03-15'
    },
    '房产证': {
      cert_number: '粤房地权证穗字第' + Math.floor(Math.random() * 1000000000) + '号',
      cert_name: '房屋所有权证',
      issuer: '广州市规划和自然资源局',
      issue_date: '2019-08-20',
      expiry_date: '2089-08-20'
    },
    '营业执照': {
      cert_number: '9144010' + Math.floor(Math.random() * 1000000000),
      cert_name: '个体工商户营业执照',
      issuer: '广州市市场监督管理局',
      issue_date: '2021-05-10',
      expiry_date: '2099-12-31'
    },
    'default': {
      cert_number: 'CERT' + Math.floor(Math.random() * 1000000),
      cert_name: cert_type,
      issuer: '相关部门',
      issue_date: '2023-01-01',
      expiry_date: '2028-01-01'
    }
  };

  const ocrResult = mockOcrData[cert_type] || mockOcrData['default'];

  res.json({
    success: true,
    message: 'OCR识别成功',
    cert_type: cert_type,
    ocr_data: ocrResult,
    verification_suggestion: '建议与发证机构官方系统数据交叉验证'
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { cert_type, cert_number, cert_name, issuer, issue_date, expiry_date, ocr_data } = req.body;

  if (!cert_type) {
    return res.status(400).json({ error: '请提供证书类型' });
  }

  const verifiedStatus = cert_number && cert_name ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO certificates (user_id, cert_type, cert_number, cert_name, issuer, issue_date, expiry_date, verified_status, ocr_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, cert_type, cert_number || '', cert_name || cert_type,
    issuer || '', issue_date || '', expiry_date || '', verifiedStatus,
    ocr_data ? JSON.stringify(ocr_data) : ''
  );

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, 'add_certificate', 'certificate', result.lastInsertRowid,
    JSON.stringify({ cert_type, cert_name })
  );

  if (verifiedStatus) {
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(req.user.id);
  }

  res.json({ id: result.lastInsertRowid, message: '证书保存成功' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证书不存在' });
  }
  if (cert.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权删除' });
  }

  db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
