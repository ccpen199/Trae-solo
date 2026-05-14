const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const { status, shop_id } = req.query;

    let query = 'SELECT o.*, s.name as shop_name FROM orders o JOIN shops s ON o.shop_id = s.id WHERE o.user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (shop_id) {
      query += ' AND o.shop_id = ?';
      params.push(shop_id);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, s.name as shop_name, s.address as shop_address
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const coupons = db.prepare('SELECT * FROM coupons WHERE order_id = ?').all(order.id);

    res.json({ success: true, data: { ...order, coupons } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.post('/create', authenticate, (req, res) => {
  try {
    const { shop_id, total_amount, coupon_ids } = req.body;

    if (!shop_id || !total_amount) {
      return res.status(400).json({ success: false, message: '店铺ID和金额必填' });
    }

    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shop_id);
    if (!shop) {
      return res.status(404).json({ success: false, message: '店铺不存在' });
    }

    let discountAmount = 0;
    if (coupon_ids && coupon_ids.length > 0) {
      for (const couponId of coupon_ids) {
        const coupon = db.prepare('SELECT * FROM coupons WHERE id = ? AND user_id = ?').get(couponId, req.user.id);
        if (coupon && coupon.status === 'unused' && new Date(coupon.expires_at) > new Date()) {
          discountAmount += coupon.amount;
        }
      }
    }

    const orderId = uuidv4();
    const finalAmount = Math.max(0, total_amount - discountAmount);

    db.prepare(`
      INSERT INTO orders (id, user_id, shop_id, total_amount, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(orderId, req.user.id, shop_id, finalAmount);

    db.prepare(`INSERT INTO coupon_logs (id, action, user_id, details) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), 'order_create', req.user.id,
      JSON.stringify({ order_id: orderId, amount: finalAmount })
    );

    const existingStat = db.prepare("SELECT id FROM statistics WHERE date = date('now')").get();
    if (existingStat) {
      db.prepare("UPDATE statistics SET order_count = order_count + 1 WHERE id = ?").run(existingStat.id);
    } else {
      db.prepare(`INSERT INTO statistics (id, date, order_count) VALUES (?, date('now'), 1)`).run(uuidv4());
    }

    res.json({
      success: true,
      data: {
        orderId,
        totalAmount: finalAmount,
        discountAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

router.post('/pay-callback', authenticate, (req, res) => {
  try {
    const { order_id, payment_method } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ success: false, message: '订单已支付' });
    }

    db.prepare(`UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?`).run(order_id);

    const shareableCoupons = db.prepare(`
      SELECT * FROM coupon_types WHERE source = 'payment' AND status = 'active' AND remain_count > 0
      LIMIT 1
    `).get();

    let generatedCoupons = [];
    if (shareableCoupons) {
      const couponId = uuidv4();
      const code = 'PY' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + shareableCoupons.valid_days * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO coupons (id, type_id, user_id, code, amount, min_amount, status, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, 'unused', ?)
      `).run(couponId, shareableCoupons.id, req.user.id, code, shareableCoupons.amount, shareableCoupons.min_amount, expiresAt);

      db.prepare('UPDATE coupon_types SET remain_count = remain_count - 1 WHERE id = ?').run(shareableCoupons.id);

      generatedCoupons.push({
        couponId,
        code,
        amount: shareableCoupons.amount,
        name: shareableCoupons.name
      });

      db.prepare(`INSERT INTO coupon_logs (id, coupon_id, action, user_id, details) VALUES (?, ?, ?, ?, ?)`).run(
        uuidv4(), couponId, 'pay_generate', req.user.id,
        JSON.stringify({ order_id, amount: shareableCoupons.amount })
      );
    }

    db.prepare(`INSERT INTO coupon_logs (id, action, user_id, details) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), 'order_pay', req.user.id,
      JSON.stringify({ order_id, amount: order.total_amount })
    );

    res.json({
      success: true,
      message: '支付成功',
      data: {
        orderId: order_id,
        generatedCoupons
      }
    });
  } catch (error) {
    console.error('Pay callback error:', error);
    res.status(500).json({ success: false, message: '支付回调处理失败' });
  }
});

module.exports = router;
