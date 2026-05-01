const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('请输入用户名和密码', 400, 'MISSING_CREDENTIALS');
  }

  const db = getDB();
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  logger.info('用户登录成功', { userId: user.id, username: user.username, role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, role, nickname } = req.body;

  if (!username || !password) {
    throw new AppError('请输入用户名和密码', 400, 'MISSING_CREDENTIALS');
  }

  if (username.length < 3 || username.length > 20) {
    throw new AppError('用户名长度应在3-20个字符之间', 400, 'INVALID_USERNAME');
  }

  if (password.length < 6) {
    throw new AppError('密码长度至少6个字符', 400, 'INVALID_PASSWORD');
  }

  const validRoles = ['viewer', 'streamer', 'merchant'];
  if (role && !validRoles.includes(role)) {
    throw new AppError('无效的角色类型', 400, 'INVALID_ROLE');
  }

  const db = getDB();

  const existingUser = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (existingUser) {
    throw new AppError('用户名已存在', 409, 'USERNAME_EXISTS');
  }

  const userId = uuidv4();
  const now = Date.now();
  const hashedPassword = await bcrypt.hash(password, 10);

  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO users (id, username, password, role, nickname, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      username,
      hashedPassword,
      role || 'viewer',
      nickname || username,
      now,
      now
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const token = jwt.sign(
    {
      id: userId,
      username: username,
      role: role || 'viewer'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  logger.info('用户注册成功', { userId, username, role: role || 'viewer' });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        username: username,
        role: role || 'viewer',
        nickname: nickname || username
      }
    }
  });
}));

router.get('/me', asyncHandler(async (req, res) => {
  const db = getDB();
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, role, nickname, avatar, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: user
  });
}));

router.post('/change-password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new AppError('请输入旧密码和新密码', 400, 'MISSING_PASSWORD');
  }

  if (newPassword.length < 6) {
    throw new AppError('新密码长度至少6个字符', 400, 'INVALID_PASSWORD');
  }

  const db = getDB();
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError('旧密码错误', 400, 'INVALID_OLD_PASSWORD');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hashedPassword, now, req.user.id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  logger.info('用户修改密码成功', { userId: req.user.id });

  res.json({
    success: true,
    message: '密码修改成功'
  });
}));

module.exports = router;
