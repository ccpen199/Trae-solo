import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname, phone, city_id, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userRole = role || 'user';
    const isAdmin = userRole === 'admin' ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, phone, city_id, ip_address, role, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, nickname || username, phone, city_id || 1, ipAddress, userRole, isAdmin);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, isAdmin: isAdmin === 1, role: userRole },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        nickname: nickname || username,
        is_verified: 0,
        is_admin: isAdmin,
        role: userRole,
        city_id: city_id || 1,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.is_admin === 1, role: user.role || 'user' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        is_verified: user.is_verified,
        is_admin: user.is_admin,
        role: user.role || 'user',
        city_id: user.city_id,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const user: any = db.prepare('SELECT id, username, nickname, avatar, phone, email, real_name, is_verified, city_id, district, street, is_admin, role, created_at FROM users WHERE id = ?').get(req.user!.id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { real_name, id_card } = req.body;

    if (!real_name || !id_card) {
      res.status(400).json({ error: '真实姓名和身份证号不能为空' });
      return;
    }

    db.prepare(`
      UPDATE users 
      SET real_name = ?, id_card = ?, is_verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(real_name, id_card, req.user!.id);

    db.prepare('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)').run(req.user!.id, 'identity_verify');

    res.json({ message: '实名认证提交成功', is_verified: 1 });
  } catch (error) {
    res.status(500).json({ error: '实名认证失败' });
  }
});

router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { nickname, avatar, city_id, district, street } = req.body;

    db.prepare(`
      UPDATE users 
      SET nickname = COALESCE(?, nickname), 
          avatar = COALESCE(?, avatar),
          city_id = COALESCE(?, city_id),
          district = COALESCE(?, district),
          street = COALESCE(?, street),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nickname, avatar, city_id, district, street, req.user!.id);

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

export default router;
