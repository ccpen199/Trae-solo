const express = require('express');
const router = express.Router();
const { getDB } = require('../models/db');
const { authenticateToken, adminOnly } = require('../middleware/auth');

router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const babyCount = db.prepare('SELECT COUNT(*) as count FROM babies').get().count;
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM product_orders').get().count;

    res.json({
      success: true,
      stats: {
        userCount,
        babyCount,
        postCount,
        orderCount
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    const users = db.prepare('SELECT id, phone, nickname, avatar, role, created_at FROM users ORDER BY created_at DESC').all();

    res.json({ success: true, users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

router.post('/services', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, description, type, price } = req.body;

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO services (title, description, type, price, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(title, description || '', type || 'online', price || 0);

    res.json({ success: true, message: '服务创建成功', serviceId: result.lastInsertRowid });
  } catch (error) {
    console.error('创建服务失败:', error);
    res.status(500).json({ success: false, message: '创建服务失败' });
  }
});

router.post('/products', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, description, price, stock, images, category, sellerType } = req.body;

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO products (name, description, price, stock, images, category, seller_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(name, description || '', price || 0, stock || 0, images ? JSON.stringify(images) : null, category || '', sellerType || 'self');

    res.json({ success: true, message: '商品创建成功', productId: result.lastInsertRowid });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ success: false, message: '创建商品失败' });
  }
});

module.exports = router;
