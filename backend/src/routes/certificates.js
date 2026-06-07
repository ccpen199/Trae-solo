const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'gd-gov-service-2024-secret-key';

function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

const certTypes = {
  id_card: { name: '居民身份证', icon: 'id-card' },
  household: { name: '居民户口簿', icon: 'book' },
  driving_license: { name: '机动车驾驶证', icon: 'car' },
  social_security: { name: '社会保障卡', icon: 'medical' },
  birth_cert: { name: '出生医学证明', icon: 'baby' },
  marriage_cert: { name: '结婚证', icon: 'heart' },
  real_estate: { name: '不动产权证', icon: 'home' },
  business_license: { name: '营业执照', icon: 'building' },
};

router.get('/my', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: '请先登录' });
  }

  const certificates = db.prepare('SELECT * FROM certificates WHERE user_id = ?').all(userId);
  
  const result = certificates.map(cert => ({
    ...cert,
    certData: JSON.parse(cert.cert_data || '{}'),
    typeInfo: certTypes[cert.cert_type] || { name: cert.cert_name, icon: 'document' }
  }));

  res.json(result);
});

router.get('/types', (req, res) => {
  res.json(certTypes);
});

router.get('/:id', (req, res) => {
  const userId = getUserId(req);
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证照不存在' });
  }

  if (userId && cert.user_id !== userId) {
    return res.status(403).json({ error: '无权查看此证照' });
  }

  res.json({
    ...cert,
    certData: JSON.parse(cert.cert_data || '{}'),
    typeInfo: certTypes[cert.cert_type] || { name: cert.cert_name, icon: 'document' }
  });
});

router.post('/verify/:id', (req, res) => {
  const userId = getUserId(req);
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证照不存在' });
  }

  const verifyCode = 'VERIFY' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

  res.json({
    success: true,
    verifyCode,
    certInfo: {
      certName: cert.cert_name,
      certNumber: cert.cert_number,
      holder: '持证人',
      status: cert.status,
      verifiedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
