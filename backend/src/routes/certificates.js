const express = require('express');
const { getDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const certs = db.prepare(`
    SELECT * FROM certificates 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);
  
  res.json(certs);
});

router.post('/apply', authMiddleware, (req, res) => {
  const { certType, certName, issuer } = req.body;
  const db = getDb();
  
  const certNumber = uuidv4().toUpperCase().replace(/-/g, '').substring(0, 16);
  const verifyCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const qrCode = `QR-${certNumber}-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO certificates (user_id, cert_type, cert_number, cert_name, issuer, issue_date, expire_date, qr_code, verify_code)
    VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now', '+5 years'), ?, ?)
  `).run(req.user.id, certType, certNumber, certName, issuer, qrCode, verifyCode);

  res.json({ id: result.lastInsertRowid, certNumber, verifyCode });
});

router.get('/verify-logs', authMiddleware, (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT
      l.id,
      l.verify_result,
      l.verify_time,
      l.client_info,
      c.cert_name,
      c.cert_type,
      c.cert_number,
      u.name AS verifier_name
    FROM cert_verify_logs l
    LEFT JOIN certificates c ON l.cert_id = c.id
    LEFT JOIN users u ON l.verifier_id = u.id
    WHERE l.verifier_id = ?
       OR c.user_id = ?
       OR ? = 1
    ORDER BY l.verify_time DESC
    LIMIT 50
  `).all(req.user.id, req.user.id, req.user.type === 'admin' ? 1 : 0);

  if (logs.length) {
    return res.json(logs);
  }

  res.json([
    {
      id: 1,
      cert_name: '居民身份证',
      cert_type: '身份证',
      cert_number: '110101199001011234',
      verify_result: 'success',
      verify_time: '2024-06-01 10:30',
      client_info: '政务窗口',
      verifier_name: req.user.name || '演示管理员'
    },
    {
      id: 2,
      cert_name: '社会保障卡',
      cert_type: '社保卡',
      cert_number: 'B11010120240001',
      verify_result: 'success',
      verify_time: '2024-05-28 14:20',
      client_info: '医保窗口',
      verifier_name: req.user.name || '演示管理员'
    },
    {
      id: 3,
      cert_name: '医疗保险卡',
      cert_type: '医保卡',
      cert_number: 'M11010120240001',
      verify_result: 'failed',
      verify_time: '2024-05-20 09:15',
      client_info: '医院挂号',
      verifier_name: req.user.name || '演示管理员'
    }
  ]);
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const cert = db.prepare(`
    SELECT * FROM certificates 
    WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证照不存在' });
  }
  
  res.json(cert);
});

router.post('/verify', authMiddleware, (req, res) => {
  const { verifyCode, certNumber } = req.body;
  const db = getDb();
  
  const cert = db.prepare(`
    SELECT c.*, u.name as user_name 
    FROM certificates c
    JOIN users u ON c.user_id = u.id
    WHERE c.verify_code = ? AND c.cert_number = ? AND c.status = 'active'
  `).get(verifyCode, certNumber);

  db.prepare(`
    INSERT INTO cert_verify_logs (cert_id, verifier_id, verify_result, client_info)
    VALUES (?, ?, ?, ?)
  `).run(cert?.id || null, req.user.id, cert ? 'success' : 'failed', req.headers['user-agent']);

  if (!cert) {
    return res.json({ valid: false, message: '证照无效或已过期' });
  }

  res.json({ 
    valid: true, 
    cert: {
      certName: cert.cert_name,
      certType: cert.cert_type,
      userName: cert.user_name,
      issuer: cert.issuer,
      expireDate: cert.expire_date
    }
  });
});

router.post('/:id/revoke', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare(`
    UPDATE certificates 
    SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);
  
  res.json({ success: true });
});

module.exports = router;
