import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, JWT_SECRET, JwtPayload } from '../middleware/auth';
import { User, UserRole } from '../types';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400).json({ error: '手机号和验证码不能为空' });
    return;
  }

  if (code !== '123456') {
    res.status(401).json({ error: '验证码错误' });
    return;
  }

  const db = getDb();
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as User | undefined;

  if (!user) {
    const userId = uuidv4();
    const now = new Date().toISOString();
    const role: UserRole = 'resident';
    db.prepare(`
      INSERT INTO users (id, phone, nickname, avatar, role, balance, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(userId, phone, `用户${phone.slice(-4)}`, null, role, now);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  }

  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user,
  });
});

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId) as User | undefined;

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json(user);
});

export default router;
