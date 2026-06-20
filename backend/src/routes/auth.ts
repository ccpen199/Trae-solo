import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => {
  const { username, password, realName, phone, email, role = 'user' } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: '用户名和密码不能为空' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(400).json({ message: '用户名已存在' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, hashedPassword, realName || '', phone || '', email || '', role);

  const user = db.prepare('SELECT id, username, real_name, phone, email, role, avatar FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: '用户名和密码不能为空' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    res.status(401).json({ message: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    res.status(401).json({ message: '用户名或密码错误' });
    return;
  }

  if (user.status !== 'active') {
    res.status(401).json({ message: '账号已被禁用' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  let profile = null;
  if (user.role === 'agent') {
    profile = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(user.id);
  } else if (user.role === 'developer') {
    profile = db.prepare('SELECT * FROM developers WHERE user_id = ?').get(user.id);
  }

  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo, profile });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, username, real_name, phone, email, role, avatar, status FROM users WHERE id = ?').get(req.user!.id) as any;
  
  let profile = null;
  if (user.role === 'agent') {
    profile = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(user.id);
  } else if (user.role === 'developer') {
    profile = db.prepare('SELECT * FROM developers WHERE user_id = ?').get(user.id);
  }

  res.json({ user, profile });
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  const { realName, phone, email, avatar } = req.body;
  db.prepare(
    'UPDATE users SET real_name = ?, phone = ?, email = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(realName || '', phone || '', email || '', avatar || '', req.user!.id);
  
  const user = db.prepare('SELECT id, username, real_name, phone, email, role, avatar FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

export default router;
