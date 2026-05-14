const express = require('express');
const router = express.Router();
const { authenticate, generateOrderNo, success, error, query, queryOne, execute } = require('../utils');

router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.userId, limit, offset]);
    const total = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [req.userId]);
    
    res.json(success({ orders, total: total.count, page, limit }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await queryOne('SELECT o.*, c.name as coupon_name, c.amount as coupon_amount FROM orders o LEFT JOIN coupons c ON o.coupon_id = c.id WHERE o.id = ? AND o.user_id = ?', [id, req.userId]);
    if (!order) return res.json(error('订单不存在'));
    res.json(success(order));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { items, coupon_id } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.json(error('请选择商品'));
    
    let totalAmount = 0;
    let discountAmount = 0;
    
    for (const item of items) {
      const product = await queryOne('SELECT price, stock FROM products WHERE id = ?', [item.product_id]);
      if (!product) return res.json(error('商品不存在'));
      if (product.stock < item.quantity) return res.json(error('库存不足'));
      totalAmount += product.price * item.quantity;
    }
    
    let coupon = null;
    if (coupon_id) {
      coupon = await queryOne('SELECT * FROM user_coupons uc LEFT JOIN coupons c ON uc.coupon_id = c.id WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 1', [coupon_id, req.userId]);
      if (coupon && coupon.min_amount <= totalAmount) {
        discountAmount = coupon.amount;
      }
    }
    
    const payAmount = totalAmount - discountAmount;
    const orderNo = generateOrderNo();
    
    const result = await execute('INSERT INTO orders (order_no, user_id, items, total_amount, discount_amount, pay_amount, coupon_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [orderNo, req.userId, JSON.stringify(items), totalAmount, discountAmount, payAmount, coupon?.coupon_id || null]);
    
    for (const item of items) {
      await execute('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?', [item.quantity, item.quantity, item.product_id]);
      await execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, item.product_id]);
    }
    
    if (coupon) {
      await execute('UPDATE user_coupons SET status = 0, used_at = CURRENT_TIMESTAMP, order_id = ? WHERE id = ?', [result.lastID, coupon_id]);
    }
    
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    res.json(success(order, '下单成功'));
  } catch (e) {
    res.json(error('下单失败'));
  }
});

router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('UPDATE orders SET status = "paid", pay_time = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status = "pending"', [id, req.userId]);
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(success(order, '支付成功'));
  } catch (e) {
    res.json(error('支付失败'));
  }
});

module.exports = router;