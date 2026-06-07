import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, signToken, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { UserResponse } from '../types.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '请输入用户名和密码' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    const token = signToken(user);

    const userInfo = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
             f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.id = ?
    `).get(user.id) as UserResponse;

    logAudit({
      userId: user.id,
      action: 'login',
      resourceType: 'auth',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: '用户登录成功',
    });

    res.json({ success: true, token, user: userInfo });
  } catch (e) {
    console.error('[Login Error]', e);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', authenticate, (req: AuthRequest, res: Response): void => {
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'logout',
      resourceType: 'auth',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: '用户登出',
    });
  }
  res.json({ success: true });
});

export default router;
