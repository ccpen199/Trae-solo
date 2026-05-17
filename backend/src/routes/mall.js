const express = require('express');
const db = require('../database');
const { authenticateToken, requireVip } = require('../middleware/auth');

const router = express.Router();

router.get('/products', (req, res) => {
  const { page = 1, pageSize = 20, category, type } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE p.status = 1';
  const params = [];

  if (category) {
    whereClause += ' AND p.category_id = ?';
    params.push(category);
  }
  if (type) {
    whereClause += ' AND p.type = ?';
    params.push(type);
  }

  const products = db.prepare(`
    SELECT p.*
    FROM products p
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM products p ${whereClause}`).get(...params);

  res.json({
    success: true,
    data: {
      list: products,
      total: total.count
    }
  });
});

router.get('/product/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ success: false, message: '商品不存在' });
  }

  res.json({ success: true, data: product });
});

router.post('/order/:productId', authenticateToken, (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: '商品不存在' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: '库存不足' });
  }

  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  const totalPrice = product.price * quantity;

  db.prepare('INSERT INTO orders (order_no, user_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, 0)').run(orderNo, req.user.id, productId, quantity, totalPrice);

  res.json({
    success: true,
    data: {
      orderNo,
      totalPrice,
      product
    }
  });
});

router.post('/pay/:orderNo', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ?').get(req.params.orderNo, req.user.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (order.status === 1) {
    return res.status(400).json({ success: false, message: '订单已支付' });
  }

  db.prepare('UPDATE orders SET status = 1, pay_time = ? WHERE id = ?').run(Math.floor(Date.now() / 1000), order.id);
  db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(order.quantity, order.product_id);

  res.json({ success: true, message: '支付成功' });
});

router.get('/orders', authenticateToken, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE o.user_id = ?';
  const params = [req.user.id];

  if (status !== undefined) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  const orders = db.prepare(`
    SELECT o.*, p.name, p.cover, p.price
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: orders });
});

router.get('/vip-info', (req, res) => {
  const vipProducts = [
    {
      id: 'vip_month',
      name: '大会员月卡',
      price: 25,
      originalPrice: 30,
      duration: 30,
      description: '畅看番剧/影视，专享高清画质，评论特权，尊贵标识'
    },
    {
      id: 'vip_quarter',
      name: '大会员季卡',
      price: 68,
      originalPrice: 90,
      duration: 90,
      description: '畅看番剧/影视，专享高清画质，评论特权，尊贵标识'
    },
    {
      id: 'vip_year',
      name: '大会员年卡',
      price: 233,
      originalPrice: 360,
      duration: 365,
      description: '畅看番剧/影视，专享高清画质，评论特权，尊贵标识'
    }
  ];

  res.json({ success: true, data: vipProducts });
});

router.post('/buy-vip/:vipId', authenticateToken, (req, res) => {
  const { vipId } = req.params;
  
  const durations = {
    'vip_month': 30,
    'vip_quarter': 90,
    'vip_year': 365
  };

  if (!durations[vipId]) {
    return res.status(400).json({ success: false, message: '无效的会员类型' });
  }

  const days = durations[vipId];
  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + days * 24 * 60 * 60;

  db.prepare('UPDATE users SET vip_type = 1, vip_expire_at = ? WHERE id = ?').run(expireTime, req.user.id);

  res.json({ success: true, message: '购买成功，大会员已开通！' });
});

module.exports = router;
