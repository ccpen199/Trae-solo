import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, phone } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const deviceFingerprint = req.headers['x-device-fingerprint'] || '';

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, phone, device_fingerprint)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, phone, deviceFingerprint);

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = db.prepare('SELECT id, username, real_name, verified, balance, level, is_admin FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const userInfo = {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    verified: user.verified,
    balance: user.balance,
    level: user.level,
    is_admin: user.is_admin
  };
  
  res.json({ token, user: userInfo });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, phone, email, real_name, id_card, verified, balance, frozen_balance, level, experience, risk_score, created_at FROM users WHERE id = ?').get(req.user.id);
  const acceptedCount = db.prepare('SELECT COUNT(*) as count FROM task_accepts WHERE worker_id = ? AND status = "completed"').get(req.user.id).count;
  const publishedCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE publisher_id = ?').get(req.user.id).count;
  
  res.json({ ...user, acceptedCount, publishedCount });
});

router.post('/verify', authMiddleware, (req, res) => {
  const { realName, idCard } = req.body;
  
  if (!realName || !idCard) {
    return res.status(400).json({ error: '请填写真实姓名和身份证号' });
  }

  db.prepare(`
    UPDATE users SET real_name = ?, id_card = ?, verified = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(realName, idCard, req.user.id);

  res.json({ success: true });
});

export default router;
