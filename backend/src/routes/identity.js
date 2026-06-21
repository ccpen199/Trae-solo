const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

router.get('/certificates/:userId', (req, res) => {
  const { userId } = req.params;
  
  const certs = db.prepare(`
    SELECT * FROM certificates WHERE user_id = ? AND status = 1
    ORDER BY cert_type
  `).all(userId);

  const certTypes = {
    id_card: { name: '居民身份证', icon: '🪪' },
    social_security: { name: '社会保障卡', icon: '💳' },
    driving_license: { name: '机动车驾驶证', icon: '🚗' },
    vehicle_license: { name: '机动车行驶证', icon: '🚙' },
    passport: { name: '护照', icon: '📕' },
    hk_macau_pass: { name: '港澳通行证', icon: '🏙️' },
    taiwan_pass: { name: '台湾通行证', icon: '🏝️' },
    birth_cert: { name: '出生医学证明', icon: '👶' },
    marriage_cert: { name: '结婚证', icon: '💒' },
    real_estate: { name: '不动产权证', icon: '🏠' },
    business_license: { name: '营业执照', icon: '🏢' },
    tax_cert: { name: '税务登记证', icon: '📊' },
  };

  const result = certs.map(c => ({
    ...c,
    type_info: certTypes[c.cert_type] || { name: c.cert_name, icon: '📄' }
  }));

  res.json({ code: 200, data: result, total: result.length });
});

router.post('/generate-code', (req, res) => {
  const { userId, certType, isOffline } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  const riskScore = Math.floor(Math.random() * 30);
  let riskLevel = 'low';
  if (riskScore > 20) riskLevel = 'high';
  else if (riskScore > 10) riskLevel = 'medium';

  const codeToken = uuidv4().replace(/-/g, '');
  const expireAt = isOffline 
    ? dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss')
    : dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss');

  const qrData = JSON.stringify({
    token: codeToken,
    userId,
    certType: certType || 'all',
    timestamp: Date.now(),
    riskLevel,
    isOffline: isOffline ? 1 : 0
  });

  db.prepare(`
    INSERT INTO identity_codes (user_id, code_token, qr_data, risk_level, risk_score, is_offline, expire_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, codeToken, qrData, riskLevel, riskScore, isOffline ? 1 : 0, expireAt);

  res.json({
    code: 200,
    data: {
      code_token: codeToken,
      qr_data: qrData,
      risk_level: riskLevel,
      risk_score: riskScore,
      is_offline: isOffline ? 1 : 0,
      expire_at: expireAt,
      user_info: {
        name: user.real_name,
        id_card: user.id_card ? user.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : ''
      }
    }
  });
});

router.post('/verify-code', (req, res) => {
  const { codeToken } = req.body;

  const codeRecord = db.prepare(`
    SELECT ic.*, u.real_name, u.id_card
    FROM identity_codes ic
    LEFT JOIN users u ON ic.user_id = u.id
    WHERE ic.code_token = ?
  `).get(codeToken);

  if (!codeRecord) {
    return res.status(404).json({ code: 404, message: '身份码无效' });
  }

  const now = dayjs();
  const expireTime = dayjs(codeRecord.expire_at);

  if (now.isAfter(expireTime)) {
    return res.status(400).json({ code: 400, message: '身份码已过期' });
  }

  res.json({
    code: 200,
    data: {
      valid: true,
      user_id: codeRecord.user_id,
      user_name: codeRecord.real_name,
      id_card: codeRecord.id_card,
      risk_level: codeRecord.risk_level,
      risk_score: codeRecord.risk_score,
      is_offline: codeRecord.is_offline,
      expire_at: codeRecord.expire_at,
      time_left: expireTime.diff(now, 'second')
    }
  });
});

router.get('/code-history/:userId', (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT * FROM identity_codes 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM identity_codes WHERE user_id = ?').get(userId).count;

  res.json({ code: 200, data: list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/risk-assessment/:userId', (req, res) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  const factors = [
    { name: '实名认证状态', score: 5, status: 'pass' },
    { name: '常用设备验证', score: Math.random() > 0.3 ? 5 : 15, status: Math.random() > 0.3 ? 'pass' : 'warning' },
    { name: '地理位置校验', score: Math.random() > 0.5 ? 5 : 10, status: Math.random() > 0.5 ? 'pass' : 'warning' },
    { name: '行为模式分析', score: Math.random() > 0.7 ? 5 : 8, status: Math.random() > 0.7 ? 'pass' : 'warning' },
  ];

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  let level = 'low';
  if (totalScore > 30) level = 'high';
  else if (totalScore > 15) level = 'medium';

  res.json({
    code: 200,
    data: {
      user_id: userId,
      risk_level: level,
      total_score: totalScore,
      factors,
      suggestions: level === 'low' ? '安全，可正常使用' : '建议完成更多验证以提升安全等级'
    }
  });
});

module.exports = router;
