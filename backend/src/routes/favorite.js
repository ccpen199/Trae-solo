const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const favorites = await query(
      `SELECT f.*, p.name, p.image, p.price, p.original_price, p.shop_name
       FROM favorites f
       LEFT JOIN products p ON f.product_id = p.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(pageSize), offset]
    );

    const countResult = await queryOne(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: favorites,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const existing = await queryOne(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    let isFavorite = false;

    if (existing) {
      await execute('DELETE FROM favorites WHERE id = ?', [existing.id]);
      isFavorite = false;
    } else {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      await execute(
        'INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), req.user.id, productId, now]
      );
      isFavorite = true;
    }

    res.json({
      success: true,
      message: existing ? '已取消收藏' : '已收藏',
      data: { is_favorite: isFavorite }
    });
  } catch (err) {
    console.error('收藏操作失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const placeholders = productIds.map(() => '?').join(',');
    await execute(
      `DELETE FROM favorites WHERE user_id = ? AND product_id IN (${placeholders})`,
      [req.user.id, ...productIds]
    );

    res.json({ success: true, message: '删除成功', data: null });
  } catch (err) {
    console.error('删除收藏失败:', err);
    res.json({ success: false, message: '删除失败', data: null });
  }
});

module.exports = router;
