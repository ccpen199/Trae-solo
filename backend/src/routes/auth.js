import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

router.post('/send-code', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号' });
  }

  res.json({ success: true, message: '验证码已发送', code: '123456' });
});

router.post('/login', (req, res) => {
  const { phone, code, password } = req.body;

  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号' });
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (code) {
    if (code !== '123456') {
      return res.status(400).json({ error: '验证码错误' });
    }
    
    if (!user) {
      const result = db.prepare('INSERT INTO users (phone, nickname, password) VALUES (?, ?, ?)').run(
        phone,
        `用户${phone.slice(-4)}`,
        '123456'
      );
      user = {
        id: result.lastInsertRowid,
        phone,
        nickname: `用户${phone.slice(-4)}`
      };
    }
  } else if (password) {
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    if (user.password !== password) {
      return res.status(400).json({ error: '密码错误' });
    }
  } else {
    return res.status(400).json({ error: '请输入验证码或密码' });
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance
    }
  });
});

router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, phone, nickname, avatar, balance, created_at FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ error: '登录已过期' });
  }
});

export default router;
