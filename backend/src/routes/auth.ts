import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'logistics_hub_secret_2024';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, role, real_name, phone, email, company_name, license_number } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({ error: '用户名、密码和角色为必填项' });
      return;
    }

    const validRoles = ['shipper', 'driver', 'carrier'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: '无效的角色类型' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(409).json({ error: '用户名已存在' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, real_name, phone, email, role, company_name, license_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, password_hash, real_name || '', phone || '', email || '', role, company_name || '', license_number || '');

    const token = jwt.sign({ userId: result.lastInsertRowid, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        role,
        real_name: real_name || '',
      },
    });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码为必填项' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ error: '账号已被禁用' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name,
        phone: user.phone,
        email: user.email,
        company_name: user.company_name,
        credit_score: user.credit_score,
      },
    });
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, real_name, phone, email, role, company_name, license_number, credit_score, status, created_at FROM users WHERE id = ?').get(req.user!.userId) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
