const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'bike_sharing_jwt_secret_key_2024';

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/send-code', (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号' });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  db.prepare(`
    INSERT INTO verification_codes (phone, code, expires_at)
    VALUES (?, ?, ?)
  `).run(phone, code, expiresAt.toISOString());

  console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}`);

  res.json({ 
    success: true, 
    message: '验证码已发送',
    mockCode: code 
  });
});

router.post('/login', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: '请输入手机号和验证码' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE phone = ? AND code = ? AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone, code);

  if (!verification) {
    return res.status(400).json({ error: '验证码无效' });
  }

  const now = new Date();
  if (new Date(verification.expires_at) < now) {
    return res.status(400).json({ error: '验证码已过期' });
  }

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (phone, nickname, credit_score)
      VALUES (?, ?, 600)
    `).run(phone, `用户${phone.slice(-4)}`);
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const onboardingStatus = {
    isLoggedIn: true,
    isVerified: user.is_verified === 1,
    hasDeposit: user.has_deposit === 1,
    creditAuthorized: user.credit_authorized === 1,
    creditScore: user.credit_score,
    canRide: (user.is_verified === 1) && (
      user.has_deposit === 1 || 
      (user.credit_authorized === 1 && user.credit_score >= 650)
    )
  };

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      isVerified: user.is_verified === 1,
      hasDeposit: user.has_deposit === 1,
      creditAuthorized: user.credit_authorized === 1,
      creditScore: user.credit_score
    },
    onboardingStatus
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

module.exports = router;
