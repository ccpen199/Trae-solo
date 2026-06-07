const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const JWT_SECRET = 'gd-gov-service-2024-secret-key';

function generateYueshengCode() {
  return 'YS' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

router.post('/login', (req, res) => {
  const { phone, idCard, authType, userType = 'personal' } = req.body;
  
  if (!phone && !idCard) {
    return res.status(400).json({ error: '请提供手机号或身份证号' });
  }

  let user;
  if (phone) {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  } else {
    user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(idCard);
  }

  if (!user) {
    const yueshengCode = generateYueshengCode();
    
    let userName = '测试用户';
    let userPhone = phone || '13800138000';
    let userIdCard = idCard || '440101199001011234';
    let certTypes = [];
    
    if (userType === 'personal') {
      userName = '张三';
      certTypes = [
        { type: 'id_card', name: '居民身份证', number: '440101199001011234', authority: '广州市公安局' },
        { type: 'household', name: '居民户口簿', number: '440101202400001', authority: '广州市公安局天河分局' },
        { type: 'driving_license', name: '机动车驾驶证', number: '440101199001011234', authority: '广州市公安局交通警察支队' },
        { type: 'social_security', name: '社会保障卡', number: '440101199001011234', authority: '广东省人力资源和社会保障厅' },
        { type: 'medical_insurance', name: '医疗保险凭证', number: '440101199001011234', authority: '广东省医疗保障局' },
      ];
    } else if (userType === 'enterprise') {
      userName = '广东XX科技有限公司';
      userPhone = phone || '13900139000';
      userIdCard = '91440101MA5XXXXX1A';
      certTypes = [
        { type: 'business_license', name: '营业执照', number: '91440101MA5XXXXX1A', authority: '广东省市场监督管理局' },
        { type: 'tax_registration', name: '税务登记证', number: '91440101MA5XXXXX1A', authority: '国家税务总局广东省税务局' },
        { type: 'social_security_unit', name: '单位社保登记证', number: '440101202400001', authority: '广东省人力资源和社会保障厅' },
      ];
    } else if (userType === 'elder') {
      userName = '李桂兰';
      userPhone = phone || '13700137000';
      userIdCard = '440101195501011234';
      certTypes = [
        { type: 'id_card', name: '居民身份证', number: '440101195501011234', authority: '广州市公安局' },
        { type: 'social_security', name: '社会保障卡', number: '440101195501011234', authority: '广东省人力资源和社会保障厅' },
        { type: 'medical_insurance', name: '医疗保险凭证', number: '440101195501011234', authority: '广东省医疗保障局' },
        { type: 'elderly_card', name: '老年人优待证', number: 'GD202400001', authority: '广东省民政厅' },
      ];
    }

    const result = db.prepare(`
      INSERT INTO users (phone, id_card, name, yuesheng_code, face_verified, user_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userPhone,
      userIdCard,
      userName,
      yueshengCode,
      1,
      userType
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    const insertCert = db.prepare(`
      INSERT INTO certificates (user_id, cert_type, cert_number, cert_name, issue_authority, issue_date, cert_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    certTypes.forEach(cert => {
      insertCert.run(
        user.id,
        cert.type,
        cert.number,
        cert.name,
        cert.authority,
        '2020-01-01',
        JSON.stringify({ sample: true })
      );
    });
  }

  const token = jwt.sign({ userId: user.id, type: 'user' }, JWT_SECRET, { expiresIn: '24h' });

  db.prepare('INSERT INTO auth_sessions (user_id, token, auth_type, expires_at) VALUES (?, ?, ?, ?)').run(
    user.id,
    token,
    authType || 'yuesheng_code',
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      idCard: user.id_card,
      yueshengCode: user.yuesheng_code,
      faceVerified: !!user.face_verified,
      avatar: user.avatar,
      userType: user.user_type || 'personal'
    }
  });
});

router.post('/face-verify', (req, res) => {
  const { token, faceData } = req.body;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const success = Math.random() > 0.1;
    
    if (success) {
      db.prepare('UPDATE users SET face_verified = 1 WHERE id = ?').run(decoded.userId);
      
      db.prepare('INSERT INTO trusted_evidence (user_id, evidence_type, evidence_hash, evidence_data) VALUES (?, ?, ?, ?)').run(
        decoded.userId,
        'face_verify',
        require('crypto').createHash('sha256').update(faceData || 'face_data').digest('hex'),
        JSON.stringify({ verifiedAt: new Date().toISOString() })
      );
      
      res.json({ success: true, message: '人脸识别通过' });
    } else {
      res.json({ success: false, message: '人脸识别失败，请重试' });
    }
  } catch (err) {
    res.status(401).json({ error: '认证失败' });
  }
});

router.post('/business-license-verify', (req, res) => {
  const { token, licenseCode } = req.body;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const success = licenseCode && licenseCode.length >= 15;
    
    if (success) {
      db.prepare('UPDATE users SET business_license = ? WHERE id = ?').run(licenseCode, decoded.userId);
      res.json({ success: true, message: '电子营业执照验证通过' });
    } else {
      res.json({ success: false, message: '营业执照验证失败' });
    }
  } catch (err) {
    res.status(401).json({ error: '认证失败' });
  }
});

router.get('/userinfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      idCard: user.id_card,
      yueshengCode: user.yuesheng_code,
      faceVerified: !!user.face_verified,
      businessLicense: user.business_license,
      avatar: user.avatar,
      address: user.address
    });
  } catch (err) {
    res.status(401).json({ error: '登录已过期' });
  }
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ adminId: admin.id, role: admin.role, type: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      department: admin.department,
      role: admin.role
    }
  });
});

module.exports = router;
