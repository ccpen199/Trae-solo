const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

router.get('/products', (req, res) => {
  try {
    const db = getDb();
    const { category, is_hot } = req.query;

    let where = ["status = 'active'"];
    let params = [];

    if (category) { where.push('category = ?'); params.push(category); }
    if (is_hot) { where.push('is_hot = 1'); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const products = db.prepare(
      `SELECT * FROM products ${whereClause} ORDER BY is_hot DESC, created_at DESC`
    ).all(...params);

    const result = products.map(p => ({
      ...p,
      price: p.price / 100,
      original_price: p.original_price / 100,
      images: JSON.parse(p.images || '[]')
    }));

    res.json({ products: result });
  } catch (err) {
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({
      ...product,
      price: product.price / 100,
      original_price: product.original_price / 100,
      images: JSON.parse(product.images || '[]'),
      specs: JSON.parse(product.specs || '{}')
    });
  } catch (err) {
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

router.post('/orders', auth, (req, res) => {
  try {
    const { product_id, quantity, address } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ error: '商品和数量必填' });
    }

    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    let discount = 1;
    if (req.user.role === ROLES.CHANNEL) {
      const tier = db.prepare('SELECT * FROM channel_tiers WHERE id = (SELECT channel_tier FROM users WHERE id = ?)')
        .get(req.user.id);
      if (tier) discount = tier.discount_rate;
    }

    const originalTotal = product.price * quantity;
    const totalAmount = Math.round(originalTotal * discount);

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO orders (id, user_id, product_id, quantity, total_amount, address, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.user.id, product_id, quantity, totalAmount, address || null, 'pending', now);

    db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ?'
    ).run(quantity, product_id);

    res.status(201).json({
      order_id: id,
      total_amount: totalAmount / 100,
      original_amount: originalTotal / 100,
      discount_applied: discount < 1,
      message: '订单创建成功'
    });
  } catch (err) {
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.get('/orders', auth, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;

    let where = ['user_id = ?'];
    let params = [req.user.id];

    if (status) { where.push('status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const orders = db.prepare(
      `SELECT o.*, p.name as product_name, p.category FROM orders o
       JOIN products p ON o.product_id = p.id
       ${whereClause}
       ORDER BY o.created_at DESC`
    ).all(...params);

    const result = orders.map(o => ({
      ...o,
      total_amount: o.total_amount / 100
    }));

    res.json({ orders: result });
  } catch (err) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.put('/orders/:id/pay', auth, (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      "UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ? AND user_id = ? AND status = 'pending'"
    ).run(now, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(400).json({ error: '订单不存在或无法支付' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    const pointsEarned = Math.floor(order.total_amount / 100 / 10);

    db.prepare(
      'UPDATE users SET points = points + ?, updated_at = ? WHERE id = ?'
    ).run(pointsEarned, now, req.user.id);

    db.prepare(
      'INSERT INTO points_transactions (user_id, amount, type, reason, related_order_id) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, pointsEarned, 'earn', '购物奖励', req.params.id);

    res.json({ message: '支付成功', points_earned: pointsEarned });
  } catch (err) {
    res.status(500).json({ error: '支付失败' });
  }
});

router.get('/points', auth, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);

    const transactions = db.prepare(
      'SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.user.id);

    res.json({
      balance: user?.points || 0,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: '获取积分失败' });
  }
});

module.exports = router;
