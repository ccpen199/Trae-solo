import { Router, Request, Response } from 'express';
import db from '../database';
import { generateToken, comparePassword, authMiddleware, AuthRequest } from '../middleware/auth';
import { User, AuthResponse } from '../types';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  if (!comparePassword(password, user.password_hash)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken(user.id, user.username, user.role);

  const { password_hash: _, ...userWithoutPassword } = user;

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, 'login', 'auth', req.ip, req.get('user-agent'));

  res.json({
    token,
    user: userWithoutPassword,
  } as AuthResponse);
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '用户未认证' });
    return;
  }

  const user = db.prepare('SELECT id, username, name, role, email, phone, created_at, updated_at FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json(user);
});

router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, 'logout', 'auth', req.ip);
  }
  res.json({ message: '登出成功' });
});

export default router;
