import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      res.status(400).json({ success: false, error: '用户名或邮箱已存在' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = ['buyer', 'supplier', 'manager', 'admin'].includes(role) ? role : 'buyer';

    const result = db.prepare(
      'INSERT INTO users (username, email, phone, password, role) VALUES (?, ?, ?, ?, ?)'
    ).run(username, email, phone || null, hashedPassword, userRole);

    db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, 0)').run(result.lastInsertRowid);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role: userRole },
      process.env.JWT_SECRET || 'okodm-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          email,
          role: userRole,
        },
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    if (user.status !== 'active') {
      res.status(401).json({ success: false, error: '账户已被禁用' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'okodm-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          real_name: user.real_name,
          is_verified: user.is_verified,
          is_signed: user.is_signed,
        },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, phone, role, avatar, real_name, id_card, is_verified, is_signed, status, created_at FROM users WHERE id = ?'
    ).get(req.user!.id) as any;

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user!.id);

    res.json({
      success: true,
      data: {
        user,
        enterprise,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { real_name, id_card, phone, avatar } = req.body;
    const userId = req.user!.id;

    db.prepare(
      'UPDATE users SET real_name = ?, id_card = ?, phone = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(real_name || null, id_card || null, phone || null, avatar || null, userId);

    const user = db.prepare(
      'SELECT id, username, email, phone, role, avatar, real_name, id_card, is_verified, is_signed, status FROM users WHERE id = ?'
    ).get(userId);

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, error: '更新用户信息失败' });
  }
});

router.post('/verify', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { real_name, id_card, id_card_image } = req.body;

    if (!real_name || !id_card) {
      res.status(400).json({ success: false, error: '真实姓名和身份证号不能为空' });
      return;
    }

    db.prepare(
      'UPDATE users SET real_name = ?, id_card = ?, is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(real_name, id_card, req.user!.id);

    res.json({ success: true, message: '实名认证提交成功' });
  } catch (error) {
    console.error('实名认证错误:', error);
    res.status(500).json({ success: false, error: '实名认证失败' });
  }
});

router.post('/payment-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: '支付密码至少6位' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET payment_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      hashedPassword,
      req.user!.id
    );

    res.json({ success: true, message: '支付密码设置成功' });
  } catch (error) {
    console.error('设置支付密码错误:', error);
    res.status(500).json({ success: false, error: '设置支付密码失败' });
  }
});

export default router;
