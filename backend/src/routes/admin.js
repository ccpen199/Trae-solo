const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pdd-secret-key-2024';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: '请输入用户名和密码', data: null });
    }

    const admin = await queryOne('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (!admin) {
      return res.json({ success: false, message: '用户名或密码错误', data: null });
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.json({ success: false, message: '用户名或密码错误', data: null });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username
        }
      }
    });
  } catch (err) {
    console.error('管理员登录失败:', err);
    res.json({ success: false, message: '登录失败', data: null });
  }
});

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录', data: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: '无权限', data: null });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '登录已过期', data: null });
  }
}

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, orders, products, shops] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users'),
      queryOne('SELECT COUNT(*) as count FROM orders'),
      queryOne('SELECT COUNT(*) as count FROM products'),
      queryOne('SELECT COUNT(*) as count FROM shops')
    ]);

    const recentOrders = await query(
      `SELECT o.*, u.nickname 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC 
       LIMIT 10`
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        users: users.count,
        orders: orders.count,
        products: products.count,
        shops: shops.count,
        recentOrders
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const users = await query(
      'SELECT id, phone, nickname, avatar, balance, coupons, vip, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(pageSize), offset]
    );

    const countResult = await queryOne('SELECT COUNT(*) as count FROM users');

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: users,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.get('/products', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const products = await query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(pageSize), offset]
    );

    const countResult = await queryOne('SELECT COUNT(*) as count FROM products');

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: products.map(p => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : []
        })),
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = `SELECT o.*, u.nickname FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
    let countSql = 'SELECT COUNT(*) as count FROM orders';
    const params = [];
    const countParams = [];

    if (status) {
      sql += ' WHERE o.status = ?';
      countSql += ' WHERE status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const orders = await query(sql, params);
    const countResult = await queryOne(countSql, countParams);

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: orders,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

module.exports = router;
