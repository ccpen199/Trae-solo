import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { success, error } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fandeng-reading-secret-key-2024';

router.post('/register', (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone || !password) {
      return error(res, '手机号和密码不能为空', 400);
    }

    const db = getDb();
    
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return error(res, '该手机号已注册', 400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (phone, password, nickname, wisdom_coins)
      VALUES (?, ?, ?, 100)
    `).run(phone, hashedPassword, nickname || `用户${phone.slice(-4)}`);

    const user = db.prepare('SELECT id, phone, nickname, is_vip, wisdom_coins FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, phone: user.phone, is_vip: user.is_vip }, JWT_SECRET, { expiresIn: '7d' });

    success(res, { user, token }, '注册成功');
  } catch (err) {
    console.error(err);
    error(res, '注册失败');
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return error(res, '手机号和密码不能为空', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return error(res, '密码错误', 400);
    }

    const token = jwt.sign({ id: user.id, phone: user.phone, is_vip: user.is_vip }, JWT_SECRET, { expiresIn: '7d' });

    const userInfo = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      vip_expire_at: user.vip_expire_at,
      wisdom_coins: user.wisdom_coins
    };

    success(res, { user: userInfo, token }, '登录成功');
  } catch (err) {
    console.error(err);
    error(res, '登录失败');
  }
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, phone, nickname, avatar, is_vip, vip_expire_at, wisdom_coins, created_at FROM users WHERE id = ?').get(req.user!.id);

    success(res, user);
  } catch (err) {
    console.error(err);
    error(res, '获取用户信息失败');
  }
});

export default router;
