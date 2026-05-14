const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { productId, totalCount = 2 } = req.body;

    if (!productId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.json({ success: false, message: '商品不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const expiresAt = dayjs().add(24, 'hour').format('YYYY-MM-DD HH:mm:ss');
    const groupId = uuidv4();

    await execute(
      'INSERT INTO groups (id, product_id, initiator_id, current_count, total_count, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [groupId, productId, req.user.id, 1, totalCount, 'pending', expiresAt, now]
    );

    const group = await queryOne('SELECT * FROM groups WHERE id = ?', [groupId]);

    res.json({
      success: true,
      message: '创建拼单成功',
      data: { ...group, product }
    });
  } catch (err) {
    console.error('创建拼单失败:', err);
    res.json({ success: false, message: '创建拼单失败', data: null });
  }
});

router.get('/list', optionalAuth, async (req, res) => {
  try {
    const { productId, page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    if (!productId) {
      return res.json({ success: false, message: '参数错误', data: { list: [], total: 0 } });
    }

    const groups = await query(
      `SELECT g.*, u.nickname as initiator_nickname, u.avatar as initiator_avatar
       FROM groups g
       LEFT JOIN users u ON g.initiator_id = u.id
       WHERE g.product_id = ? AND g.status = 'pending' AND g.expires_at > datetime('now', 'localtime')
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, parseInt(pageSize), offset]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as count FROM groups WHERE product_id = ? AND status = 'pending' AND expires_at > datetime('now', 'localtime')`,
      [productId]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: groups,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取拼单列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 10 } });
  }
});

router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await queryOne(
      `SELECT g.*, u.nickname as initiator_nickname, u.avatar as initiator_avatar, p.name as product_name, p.image as product_image, p.price
       FROM groups g
       LEFT JOIN users u ON g.initiator_id = u.id
       LEFT JOIN products p ON g.product_id = p.id
       WHERE g.id = ?`,
      [id]
    );

    if (!group) {
      return res.json({ success: false, message: '拼单不存在', data: null });
    }

    const orders = await query(
      `SELECT o.*, u.nickname, u.avatar
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.group_id = ? AND o.pay_status = 'paid'`,
      [id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...group,
        members: orders
      }
    });
  } catch (err) {
    console.error('获取拼单详情失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

module.exports = router;
