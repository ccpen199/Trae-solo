import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getQuery, runQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'car_rental_secret_key_2024';

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' });
    }

    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    if (user.status !== 1) {
      return res.json({ code: 400, message: '账号已被禁用' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userInfo } = user;
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, real_name, phone, email } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空' });
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE username = ? OR phone = ?', [username, phone]);
    if (existingUser) {
      return res.json({ code: 400, message: '用户名或手机号已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await runQuery(
      'INSERT INTO users (username, password, real_name, phone, email, role, status) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [username, hashedPassword, real_name || '', phone || '', email || '', 'customer']
    );

    res.json({ code: 200, message: '注册成功', data: { id: result.lastID } });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getQuery('SELECT id, username, real_name, phone, email, role, id_card, license_number, license_verified, created_at FROM users WHERE id = ?', [req.user!.id]);
    res.json({ code: 200, message: 'success', data: user });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  res.json({ code: 200, message: '退出登录成功' });
});

export default router;
