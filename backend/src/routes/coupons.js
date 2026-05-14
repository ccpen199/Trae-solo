const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/types', optionalAuth, (req, res) => {
  try {
    const { source, shop_id, status } = req.query;

    let query = 'SELECT * FROM coupon_types WHERE 1=1';
    const params = [];

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    if (shop_id) {
      query += ' AND (shop_id = ? OR shop_id IS NULL)';
      params.push(shop_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += " AND status = 'active'";
    }

    query += ' ORDER BY created_at DESC';

    const types = db.prepare(query).all(...params);

    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Get coupon types error:', error);
    res.status(500).json({ success: false, message: '获取优惠券类型失败' });
  }
});

router.get('/types/:id', optionalAuth, (req, res) => {
  try {
    const type = db.prepare('SELECT * FROM coupon_types WHERE id = ?').get(req.params.id);

    if (!type) {
      return res.status(404).json({ success: false, message: '优惠券类型不存在' });
    }

    res.json({ success: true, data: type });
  } catch (error) {
    console.error('Get coupon type error:', error);
    res.status(500).json({ success: false, message: '获取优惠券类型失败' });
  }
});

router.post('/types', authenticate, (req, res) => {
  try {
    const {
      name, type, amount, min_amount, max_amount, total_count, per_user_limit,
      use_threshold, valid_days, start_time, end_time, source, shop_id, is_auto_select
    } = req.body;

    if (!name || !type || !amount || !source) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO coupon_types (id, name, type, amount, min_amount, max_amount, total_count, remain_count, per_user_limit, use_threshold, valid_days, start_time, end_time, source, shop_id, is_auto_select)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, type, amount, min_amount || 0, max_amount || null, total_count || 0,
      total_count || 0, per_user_limit || 1, use_threshold || 0, valid_days || 30,
      start_time || null, end_time || null, source, shop_id || null, is_auto_select ? 1 : 0
    );

    const newType = db.prepare('SELECT * FROM coupon_types WHERE id = ?').get(id);

    res.json({ success: true, data: newType });
  } catch (error) {
    console.error('Create coupon type error:', error);
    res.status(500).json({ success: false, message: '创建优惠券类型失败' });
  }
});

router.put('/types/:id', authenticate, (req, res) => {
  try {
    const { name, amount, min_amount, max_amount, total_count, per_user_limit, use_threshold, valid_days, start_time, end_time, status } = req.body;

    const type = db.prepare('SELECT * FROM coupon_types WHERE id = ?').get(req.params.id);
    if (!type) {
      return res.status(404).json({ success: false, message: '优惠券类型不存在' });
    }

    db.prepare(`
      UPDATE coupon_types SET name = ?, amount = ?, min_amount = ?, max_amount = ?, total_count = ?, per_user_limit = ?, use_threshold = ?, valid_days = ?, start_time = ?, end_time = ?, status = ?
      WHERE id = ?
    `).run(
      name || type.name, amount || type.amount, min_amount ?? type.min_amount,
      max_amount ?? type.max_amount, total_count ?? type.total_count,
      per_user_limit ?? type.per_user_limit, use_threshold ?? type.use_threshold,
      valid_days ?? type.valid_days, start_time ?? type.start_time,
      end_time ?? type.end_time, status ?? type.status, req.params.id
    );

    const updatedType = db.prepare('SELECT * FROM coupon_types WHERE id = ?').get(req.params.id);

    res.json({ success: true, data: updatedType });
  } catch (error) {
    console.error('Update coupon type error:', error);
    res.status(500).json({ success: false, message: '更新优惠券类型失败' });
  }
});

router.delete('/types/:id', authenticate, (req, res) => {
  try {
    const type = db.prepare('SELECT * FROM coupon_types WHERE id = ?').get(req.params.id);
    if (!type) {
      return res.status(404).json({ success: false, message: '优惠券类型不存在' });
    }

    db.prepare("UPDATE coupon_types SET status = 'deleted' WHERE id = ?").run(req.params.id);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete coupon type error:', error);
    res.status(500).json({ success: false, message: '删除优惠券类型失败' });
  }
});

router.post('/receive', optionalAuth, (req, res) => {
  try {
    const { type_id, user_id, openid } = req.body;

    const targetUserId = user_id || (req.user?.id);
    const receiverOpenid = openid || (req.user?.openid);

    if (!targetUserId && !receiverOpenid) {
      return res.status(400).json({ success: false, message: '用户未登录' });
    }

    const type = db.prepare('SELECT * FROM coupon_types WHERE id = ? AND status = ?').get(type_id, 'active');

    if (!type) {
      return res.status(404).json({ success: false, message: '优惠券不存在或已下架' });
    }

    if (type.remain_count <= 0) {
      return res.status(400).json({ success: false, message: '优惠券已领完' });
    }

    const userUsedCount = db.prepare('SELECT COUNT(*) as count FROM coupons WHERE type_id = ? AND user_id = ?').get(type_id, targetUserId);
    if (userUsedCount.count >= type.per_user_limit) {
      return res.status(400).json({ success: false, message: '您已领取过该优惠券' });
    }

    if (type.start_time && new Date(type.start_time) > new Date()) {
      return res.status(400).json({ success: false, message: '优惠券领取尚未开始' });
    }
    if (type.end_time && new Date(type.end_time) < new Date()) {
      return res.status(400).json({ success: false, message: '优惠券已过期' });
    }

    let actualAmount = type.amount;
    if (type.type === 'random') {
      const min = type.min_amount || 1;
      const max = type.max_amount || type.amount;
      actualAmount = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const couponId = uuidv4();
    const code = 'CP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + (type.valid_days || 30) * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO coupons (id, type_id, user_id, code, amount, min_amount, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unused', ?)
    `).run(couponId, type_id, targetUserId, code, actualAmount, type.min_amount || 0, expiresAt);

    db.prepare('UPDATE coupon_types SET remain_count = remain_count - 1 WHERE id = ?').run(type_id);

    db.prepare(`INSERT INTO coupon_logs (id, coupon_id, action, user_id, details) VALUES (?, ?, ?, ?, ?)`).run(
      uuidv4(), couponId, 'receive', targetUserId,
      JSON.stringify({ source: type.source, amount: actualAmount })
    );

    res.json({
      success: true,
      data: {
        couponId,
        code,
        amount: actualAmount,
        minAmount: type.min_amount || 0,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Receive coupon error:', error);
    res.status(500).json({ success: false, message: '领取优惠券失败' });
  }
});

router.get('/my', optionalAuth, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    const { status } = req.query;

    let query = 'SELECT c.*, ct.name as type_name, ct.type as coupon_type, s.name as shop_name FROM coupons c LEFT JOIN coupon_types ct ON c.type_id = ct.id LEFT JOIN shops s ON ct.shop_id = s.id WHERE c.user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const coupons = db.prepare(query).all(...params);

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Get my coupons error:', error);
    res.status(500).json({ success: false, message: '获取优惠券失败' });
  }
});

router.get('/auto-select', authenticate, (req, res) => {
  try {
    const { order_amount, shop_id } = req.query;

    if (!order_amount) {
      return res.status(400).json({ success: false, message: '订单金额必填' });
    }

    const coupons = db.prepare(`
      SELECT c.*, ct.name as type_name, ct.is_auto_select, ct.shop_id
      FROM coupons c
      JOIN coupon_types ct ON c.type_id = ct.id
      WHERE c.user_id = ? AND c.status = 'unused'
      AND c.expires_at > datetime('now')
      AND (ct.shop_id IS NULL OR ct.shop_id = ?)
      AND c.amount <= ?
      ORDER BY c.amount DESC
    `).all(req.user.id, shop_id || null, order_amount);

    let selectedCoupon = null;
    for (const coupon of coupons) {
      if (coupon.is_auto_select && order_amount >= coupon.min_amount) {
        selectedCoupon = coupon;
        break;
      }
    }

    if (!selectedCoupon && coupons.length > 0) {
      for (const coupon of coupons) {
        if (order_amount >= coupon.min_amount) {
          selectedCoupon = coupon;
          break;
        }
      }
    }

    res.json({ success: true, data: selectedCoupon });
  } catch (error) {
    console.error('Auto select coupon error:', error);
    res.status(500).json({ success: false, message: '获取可用优惠券失败' });
  }
});

router.post('/use', authenticate, (req, res) => {
  try {
    const { coupon_id, order_id } = req.body;

    if (!coupon_id) {
      return res.status(400).json({ success: false, message: '优惠券ID必填' });
    }

    const coupon = db.prepare('SELECT c.*, ct.min_amount as threshold FROM coupons c JOIN coupon_types ct ON c.type_id = ct.id WHERE c.id = ? AND c.user_id = ?').get(coupon_id, req.user.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: '优惠券不存在' });
    }

    if (coupon.status === 'used') {
      return res.status(400).json({ success: false, message: '优惠券已使用' });
    }

    if (new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '优惠券已过期' });
    }

    db.prepare(`UPDATE coupons SET status = 'used', used_at = datetime('now'), order_id = ? WHERE id = ?`).run(order_id || null, coupon_id);

    db.prepare(`INSERT INTO coupon_logs (id, coupon_id, action, user_id, details) VALUES (?, ?, ?, ?, ?)`).run(
      uuidv4(), coupon_id, 'use', req.user.id,
      JSON.stringify({ order_id, amount: coupon.amount })
    );

    res.json({ success: true, message: '使用成功', data: { amount: coupon.amount } });
  } catch (error) {
    console.error('Use coupon error:', error);
    res.status(500).json({ success: false, message: '使用优惠券失败' });
  }
});

module.exports = router;
