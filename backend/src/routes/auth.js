const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'citylife-secret-key-2024';

router.post('/register', (req, res) => {
  try {
    const { username, email, password, nickname, city } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ code: 1, message: '用户名、邮箱和密码不能为空' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ code: 1, message: '用户名或邮箱已存在' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, nickname, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, username, email, password_hash, nickname || username, city || null, now, now);

    const token = jwt.sign({ id, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    const user = db.prepare('SELECT id, username, email, nickname, city, role, created_at FROM users WHERE id = ?').get(id);

    res.json({ code: 0, data: { token, user }, message: '注册成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 1, message: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user) {
      return res.status(401).json({ code: 1, message: '用户名或密码错误' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ code: 1, message: '账号已被封禁' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 1, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password_hash, ...safeUser } = user;

    res.json({ code: 0, data: { token, user: safeUser }, message: '登录成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.*, cl.name as level_name, cl.min_score, cl.max_score, cl.ad_share_rate, cl.tip_share_rate
      FROM users u
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE u.id = ?
    `).get(req.user.id);
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }
    const { password_hash, ...safeUser } = user;
    res.json({ code: 0, data: safeUser, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
