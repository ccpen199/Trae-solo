import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status === 'inactive') {
    return res.status(403).json({ error: '账号已被禁用' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      area: user.area,
      skills: JSON.parse(user.skills || '[]'),
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, role, phone, skills, area } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: '用户名、密码、姓名和角色不能为空' });
  }

  const validRoles = ['customer', 'service_agent', 'dispatcher', 'engineer', 'finance'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: '无效的角色类型' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role, phone, skills, area)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, password, name, role, phone || null, JSON.stringify(skills || []), area || null);

    const token = jwt.sign(
      { id: result.lastInsertRowid, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, username, name, role, phone: phone || null, area: area || null, skills: skills || [] }
    });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    skills: JSON.parse(user.skills || '[]'),
    area: user.area,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  });
});

export default router;
