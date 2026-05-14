const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

router.post('/phone-login', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (phone, nickname, is_shop_owner)
      VALUES (?, ?, 0)
    `).run(phone, `用户${phone.slice(-4)}`);
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      is_shop_owner: user.is_shop_owner,
      level: user.level,
      points: user.points
    }
  });
});

router.post('/wechat-login', (req, res) => {
  const { code, iv, encryptedData } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const mockOpenid = `wx_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(mockOpenid);

  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (openid, nickname, avatar, is_shop_owner)
      VALUES (?, ?, ?, 0)
    `).run(mockOpenid, `微信用户${Math.floor(Math.random() * 10000)}`, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20avatar%20portrait&image_size=square');
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      openid: user.openid,
      nickname: user.nickname,
      avatar: user.avatar,
      is_shop_owner: user.is_shop_owner,
      level: user.level,
      points: user.points
    }
  });
});

router.post('/send-code', (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  res.json({
    success: true,
    message: 'Verification code sent',
    mockCode: '123456'
  });
});

router.post('/bind-phone', (req, res) => {
  const { phone, code, userId } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (existingUser && existingUser.id !== userId) {
    return res.status(400).json({ error: 'Phone already bound to another account' });
  }

  db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar
    }
  });
});

module.exports = router;
