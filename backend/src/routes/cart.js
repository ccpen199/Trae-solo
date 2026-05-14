const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const carts = await query(`
      SELECT c.*, p.name, p.image, p.price, p.original_price, p.stock, p.shop_name
      FROM carts c
      LEFT JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      message: '获取成功',
      data: carts.map(c => ({
        id: c.id,
        product_id: c.product_id,
        product_name: c.name,
        product_image: c.image,
        price: c.price,
        original_price: c.original_price,
        quantity: c.quantity,
        selected: c.selected === 1,
        stock: c.stock,
        shop_name: c.shop_name
      }))
    });
  } catch (err) {
    console.error('获取购物车失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.json({ success: false, message: '商品不存在', data: null });
    }

    if (product.stock < quantity) {
      return res.json({ success: false, message: '库存不足', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const existingCart = await queryOne(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existingCart) {
      await execute(
        'UPDATE carts SET quantity = quantity + ?, updated_at = ? WHERE id = ?',
        [quantity, now, existingCart.id]
      );
    } else {
      await execute(
        'INSERT INTO carts (id, user_id, product_id, quantity, selected, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.user.id, productId, quantity, 1, now, now]
      );
    }

    const countResult = await queryOne(
      'SELECT SUM(quantity) as total FROM carts WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '添加成功',
      data: { total: countResult.total || 0 }
    });
  } catch (err) {
    console.error('添加购物车失败:', err);
    res.json({ success: false, message: '添加失败', data: null });
  }
});

router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { cartId, quantity, selected } = req.body;

    if (!cartId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const cart = await queryOne('SELECT * FROM carts WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
    if (!cart) {
      return res.json({ success: false, message: '购物车商品不存在', data: null });
    }

    const updates = [];
    const params = [];

    if (typeof quantity !== 'undefined') {
      if (quantity < 1) {
        return res.json({ success: false, message: '数量不能小于1', data: null });
      }
      updates.push('quantity = ?');
      params.push(quantity);
    }

    if (typeof selected !== 'undefined') {
      updates.push('selected = ?');
      params.push(selected ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json({ success: false, message: '没有要更新的内容', data: null });
    }

    updates.push('updated_at = ?');
    params.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    params.push(cartId);

    await execute(`UPDATE carts SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: '更新成功', data: null });
  } catch (err) {
    console.error('更新购物车失败:', err);
    res.json({ success: false, message: '更新失败', data: null });
  }
});

router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { cartIds } = req.body;

    if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const placeholders = cartIds.map(() => '?').join(',');
    await execute(
      `DELETE FROM carts WHERE user_id = ? AND id IN (${placeholders})`,
      [req.user.id, ...cartIds]
    );

    res.json({ success: true, message: '删除成功', data: null });
  } catch (err) {
    console.error('删除购物车失败:', err);
    res.json({ success: false, message: '删除失败', data: null });
  }
});

router.get('/count', authMiddleware, async (req, res) => {
  try {
    const result = await queryOne(
      'SELECT SUM(quantity) as total FROM carts WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: { total: result.total || 0 }
    });
  } catch (err) {
    console.error('获取购物车数量失败:', err);
    res.json({ success: false, message: '获取失败', data: { total: 0 } });
  }
});

module.exports = router;
