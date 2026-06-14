import { Router } from 'express';
import db from '../db';
import type { User } from '../../shared/types';

const router = Router();

router.post('/login', (req, res) => {
  const { phone, role = 'sender' } = req.body;
  if (!phone) {
    return res.status(400).json({ error: '手机号不能为空' });
  }
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
  if (!user) {
    const result = db
      .prepare('INSERT INTO users (phone, nickname, role) VALUES (?, ?, ?)')
      .run(phone, `用户${phone.slice(-4)}`, role);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
  } else if (role && user.role !== role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;
  }
  const userData: User = {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    role: user.role,
    createdAt: user.created_at,
  };
  res.json({ user: userData, token: `mock_token_${user.id}` });
});

router.get('/profile', (req, res) => {
  const userId = 1;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const userData: User = {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    role: user.role,
    createdAt: user.created_at,
  };
  res.json(userData);
});

export default router;
