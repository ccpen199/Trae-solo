import { Router } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import db from '../database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  // 简化开发环境的密码验证：直接比较明文密码 'admin'
  if (password !== 'admin') {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const secret: Secret = process.env.JWT_SECRET || 'insurance-claim-platform-secret-key-2024';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
  });
});

router.get('/profile', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

router.get('/users', authenticate, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, phone FROM users').all();
  res.json(users);
});

export default router;
