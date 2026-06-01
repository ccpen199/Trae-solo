import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'real_estate_platform_secret_key_2024';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, real_name, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名或邮箱已存在' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, phone, real_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(username, email, hashedPassword, phone || '', real_name || '', role || 'user');

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, username, role: role || 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          phone,
          real_name,
          role: role || 'user'
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: '账户已被禁用' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    let agentInfo = null;
    if (user.role === 'agent') {
      agentInfo = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(user.id);
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          real_name: user.real_name,
          role: user.role,
          avatar: user.avatar
        },
        agent: agentInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.get('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const user = db.prepare('SELECT id, username, email, phone, real_name, role, avatar, created_at FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    let agentInfo = null;
    if (user.role === 'agent') {
      agentInfo = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(user.id);
    }

    res.json({
      success: true,
      data: { user, agent: agentInfo }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
});

export default router;
