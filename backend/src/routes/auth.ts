import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware';
import { User } from '../types';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

router.post('/login', (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { username, password } = result.data;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      real_name: user.real_name,
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      store_id: user.store_id,
      city: user.city,
    },
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '登出成功' });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  const user = db.prepare('SELECT id, username, real_name, role, phone, email, avatar, store_id, city, status FROM users WHERE id = ?').get(req.user.id) as User | undefined;
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

export default router;
