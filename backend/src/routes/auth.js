const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const { ROLE_NAMES } = require('../utils/constants');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'map_navigation_jwt_secret_key_2024',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          roleName: ROLE_NAMES[user.role],
          phone: user.phone,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '数据库错误',
      error: err.message,
    });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, name, role, phone } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和姓名不能为空',
      });
    }

    const validRoles = ['USER', 'DRIVER', 'DISPATCHER', 'OPERATOR'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色类型',
      });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在',
      });
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(userId, username, hashedPassword, role || 'USER', name, phone);

    res.json({
      success: true,
      data: {
        id: userId,
        username,
        name,
        role: role || 'USER',
      },
      message: '注册成功',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: err.message,
    });
  }
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'map_navigation_jwt_secret_key_2024'
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token无效或已过期',
    });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问',
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有权限执行此操作',
      });
    }

    next();
  };
};

module.exports = { router, authMiddleware, roleMiddleware };
