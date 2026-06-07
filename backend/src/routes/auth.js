import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { phone, password, name } = req.body;
    if (!phone || !password || !name) {
      return res.json({ code: 1, message: '手机号、密码和姓名不能为空' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM riders WHERE phone = ?').get(phone);
    if (existing) {
      return res.json({ code: 1, message: '该手机号已注册' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const result = db
      .prepare(
        'INSERT INTO riders (phone, password_hash, name, role, credit_score, status, balance, frozen_balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(phone, password_hash, name, 'rider', 100, 'active', 0, 0, now, now);

    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(rider);

    res.json({
      code: 0,
      data: { token, rider: sanitizeRider(rider) },
      message: '注册成功',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.json({ code: 1, message: '手机号和密码不能为空' });
    }

    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE phone = ?').get(phone);
    if (!rider) {
      return res.json({ code: 1, message: '用户不存在' });
    }

    if (!bcrypt.compareSync(password, rider.password_hash)) {
      return res.json({ code: 1, message: '密码错误' });
    }

    if (rider.status === 'disabled') {
      return res.json({ code: 1, message: '账号已被禁用' });
    }

    const token = generateToken(rider);
    res.json({
      code: 0,
      data: { token, rider: sanitizeRider(rider) },
      message: '登录成功',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.rider.id);
    if (!rider) {
      return res.json({ code: 1, message: '用户不存在' });
    }
    res.json({ code: 0, data: sanitizeRider(rider), message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

function generateToken(rider) {
  return jwt.sign(
    { id: rider.id, phone: rider.phone, role: rider.role, name: rider.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeRider(rider) {
  const { password_hash, ...rest } = rider;
  return rest;
}

export default router;
