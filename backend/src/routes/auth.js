import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone
    };

    res.json({
      message: '登录成功',
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '请填写必要信息' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = role || 'borrower';

    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(username, hashedPassword, userRole, name, phone);
    const userId = result.lastInsertRowid;

    if (userRole === 'borrower') {
      db.prepare(`
        INSERT INTO borrowers (user_id, credit_level, credit_score)
        VALUES (?, 'A', 650)
      `).run(userId);

      db.prepare(`
        INSERT INTO credit_limits (borrower_id, total_limit, available_limit, max_single_loan)
        VALUES ((SELECT id FROM borrowers WHERE user_id = ?), 200000, 200000, 100000)
      `).run(userId);
    }

    const token = jwt.sign(
      { userId, username, role: userRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: userId,
        username,
        name,
        role: userRole,
        phone
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }

  const user = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let additionalInfo = {};
  if (user.role === 'borrower') {
    const borrower = db.prepare(`
      SELECT b.*, cl.total_limit, cl.available_limit, cl.used_limit
      FROM borrowers b
      LEFT JOIN credit_limits cl ON b.id = cl.borrower_id
      WHERE b.user_id = ?
    `).get(user.id);

    if (borrower) {
      additionalInfo = {
        creditLevel: borrower.credit_level,
        creditScore: borrower.credit_score,
        totalLimit: borrower.total_limit,
        availableLimit: borrower.available_limit,
        usedLimit: borrower.used_limit
      };
    }
  }

  res.json({
    ...user,
    ...additionalInfo
  });
});

export default router;
