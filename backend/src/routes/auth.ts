import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, name: user.name, avatar: user.avatar }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, role, name, phone, email } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ success: false, error: '用户名、密码、角色和姓名不能为空' });
    }

    const validRoles = ['owner', 'designer', 'company', 'supplier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: '无效的角色类型' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(
      'INSERT INTO users (username, password_hash, role, name, phone, email) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = insertUser.run(username, hash, role, name, phone || null, email || null);
    const userId = result.lastInsertRowid;

    const roleTableMap: Record<string, string> = {
      owner: 'owners',
      designer: 'designers',
      company: 'companies',
      supplier: 'suppliers'
    };

    const tableName = roleTableMap[role];
    if (tableName) {
      db.prepare(`INSERT INTO ${tableName} (user_id) VALUES (?)`).run(userId);
    }

    const token = jwt.sign(
      { id: userId, username, role, name },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: userId, username, role, name }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const user = db.prepare('SELECT id, username, role, name, phone, email, avatar, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    let roleInfo = null;
    const roleTableMap: Record<string, string> = {
      owner: 'owners',
      designer: 'designers',
      company: 'companies',
      supplier: 'suppliers'
    };

    const tableName = roleTableMap[user.role];
    if (tableName) {
      roleInfo = db.prepare(`SELECT * FROM ${tableName} WHERE user_id = ?`).get(user.id);
    }

    res.json({ success: true, data: { ...user, roleInfo } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

export default router;
