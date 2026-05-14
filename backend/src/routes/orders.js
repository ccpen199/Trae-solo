const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'token无效' });
    }
    req.userId = decoded.userId;
    next();
  });
}

router.get('/', authenticate, (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  let params = [req.userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  try {
    const orders = db.prepare(query).all(...params);
    const ordersWithDetails = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    res.json({ success: true, data: ordersWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...order,
        items: JSON.parse(order.items)
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  const { merchant_id, address_id, items, total_price, delivery_fee, remark } = req.body;

  if (!merchant_id || !address_id || !items || !total_price) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const info = db.prepare('INSERT INTO orders (user_id, merchant_id, address_id, items, total_price, delivery_fee, remark) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.userId, merchant_id, address_id, JSON.stringify(items), total_price, delivery_fee || 0, remark || '');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
    res.json({ 
      success: true, 
      message: '订单创建成功', 
      data: {
        ...order,
        items: JSON.parse(order.items)
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

router.put('/:id/pay', authenticate, (req, res) => {
  const { id } = req.params;
  const { pay_method } = req.body;

  try {
    db.prepare('UPDATE orders SET pay_status = ?, pay_method = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run('paid', pay_method || 'alipay', 'confirmed', new Date().toISOString(), id, req.userId);
    res.json({ success: true, message: '支付成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '支付失败' });
  }
});

module.exports = router;
