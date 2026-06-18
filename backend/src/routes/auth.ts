import { Router, Request, Response } from 'express';
import db from '../models/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'housekeeping_saas_jwt_secret_2024',
    { expiresIn: '7d' }
  );

  let profile = null;
  if (user.role === 'worker') {
    profile = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(user.id);
  } else if (user.role === 'employer') {
    profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
    profile,
  });
});

router.post('/register', (req: Request, res: Response) => {
  const { username, password, role, phone } = req.body;
  if (!username || !password || !role || !phone) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = require('uuid').v4();

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO users (id, username, password, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run(userId, username, hashedPassword, role, phone);
  });

  try {
    tx();
    res.json({ success: true, message: '注册成功' });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

router.get('/me', authMiddleware(), (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, username, role, phone, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let profile = null;
  if ((user as any).role === 'worker') {
    profile = db.prepare('SELECT * FROM workers WHERE user_id = ?').get((user as any).id);
  } else if ((user as any).role === 'employer') {
    profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get((user as any).id);
  }

  res.json({ user, profile });
});

export default router;
