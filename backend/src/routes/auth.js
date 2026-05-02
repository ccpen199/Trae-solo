const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const AuditLogger = require('../audit-logger');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'securities-trading-jwt-secret-key-2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token 无效或已过期' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权访问' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      AuditLogger.log('LOGIN_FAILED', 'user', null, { username, reason: '用户不存在' }, null, req, 'failed', '用户不存在');
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      AuditLogger.log('LOGIN_FAILED', 'user', user.id, { username, reason: '密码错误' }, user, req, 'failed', '密码错误');
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    AuditLogger.log('LOGIN_SUCCESS', 'user', user.id, { username }, user, req);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  AuditLogger.log('LOGOUT', 'user', req.user.id, null, req.user, req);
  res.json({ message: '已登出' });
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, name, role, status FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    const fundId = uuidv4();

    db.exec('BEGIN TRANSACTION');

    db.prepare(`
      INSERT INTO users (id, username, password, role, name, status)
      VALUES (?, ?, ?, 'investor', ?, 'active')
    `).run(userId, username, hashedPassword, name);

    db.prepare(`
      INSERT INTO funds (id, user_id, total_balance, available_balance, frozen_balance, total_profit_loss)
      VALUES (?, ?, 1000000.0, 1000000.0, 0.0, 0.0)
    `).run(fundId, userId);

    db.exec('COMMIT');

    AuditLogger.log('USER_REGISTERED', 'user', userId, { username, name }, null, req);

    res.status(201).json({
      message: '注册成功',
      user: { id: userId, username, name, role: 'investor' }
    });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/users', authenticateToken, requireRole('exchange_admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, status, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = { router, authenticateToken, requireRole };
