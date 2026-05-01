const express = require('express');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireRole, PERMISSIONS, requirePermission, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/profile', asyncHandler(async (req, res) => {
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

router.put('/profile', asyncHandler(async (req, res) => {
  const { nickname, avatar } = req.body;
  const db = getDB();
  const now = Date.now();

  const updates = [];
  const params = [];

  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }

  if (avatar !== undefined) {
    updates.push('avatar = ?');
    params.push(avatar);
  }

  if (updates.length === 0) {
    throw new AppError('没有需要更新的字段', 400, 'NOTHING_TO_UPDATE');
  }

  updates.push('updated_at = ?');
  params.push(now, req.user.id);

  await new Promise((resolve, reject) => {
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const updatedUser = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, role, nickname, avatar, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  logger.info('用户资料更新成功', { userId: req.user.id });

  res.json({
    success: true,
    data: updatedUser
  });
}));

router.get('/list', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { role, limit = 50, offset = 0 } = req.query;
  const db = getDB();

  let query = 'SELECT id, username, role, nickname, avatar, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const total = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  res.json({
    success: true,
    data: {
      list: users,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

router.post('/create', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const { username, password, role, nickname } = req.body;

  if (!username || !password || !role) {
    throw new AppError('参数不完整', 400, 'MISSING_PARAMS');
  }

  const validRoles = ['viewer', 'streamer', 'merchant', 'platform_admin'];
  if (!validRoles.includes(role)) {
    throw new AppError('无效的角色类型', 400, 'INVALID_ROLE');
  }

  if (password.length < 6) {
    throw new AppError('密码长度至少6个字符', 400, 'INVALID_PASSWORD');
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
    `, [userId, username, hashedPassword, role, nickname || username, now, now], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  logger.info('管理员创建用户成功', { userId, username, role });

  res.status(201).json({
    success: true,
    data: {
      id: userId,
      username,
      role,
      nickname: nickname || username
    }
  });
}));

router.get('/stats', requireRole(ROLES.PLATFORM_ADMIN), asyncHandler(async (req, res) => {
  const db = getDB();

  const roleStats = await new Promise((resolve, reject) => {
    db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const liveStreamStats = await new Promise((resolve, reject) => {
    db.all('SELECT status, COUNT(*) as count FROM live_streams GROUP BY status', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const orderStats = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        status, 
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM orders 
      GROUP BY status
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const totalProducts = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.count : 0);
    });
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const todayOrders = await new Promise((resolve, reject) => {
    db.get(`
      SELECT COUNT(*) as count, SUM(total_amount) as total_amount
      FROM orders WHERE created_at >= ?
    `, [todayTimestamp], (err, row) => {
      if (err) reject(err);
      else resolve(row || { count: 0, total_amount: 0 });
    });
  });

  res.json({
    success: true,
    data: {
      users: {
        total: roleStats.reduce((sum, r) => sum + r.count, 0),
        byRole: roleStats
      },
      liveStreams: {
        byStatus: liveStreamStats
      },
      orders: {
        total: orderStats.reduce((sum, r) => sum + r.count, 0),
        totalRevenue: orderStats.reduce((sum, r) => sum + (r.total_amount || 0), 0),
        byStatus: orderStats,
        today: todayOrders
      },
      products: {
        total: totalProducts
      }
    }
  });
}));

module.exports = router;
