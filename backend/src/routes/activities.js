const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT a.*, ct.name as coupon_name, ct.amount as coupon_amount FROM activities a LEFT JOIN coupon_types ct ON a.coupon_type_id = ct.id';
    const params = [];

    if (status) {
      query += ' WHERE a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.created_at DESC';

    const activities = db.prepare(query).all(...params);

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: '获取活动失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT a.*, ct.name as coupon_name, ct.amount as coupon_amount, ct.type as coupon_type
      FROM activities a
      LEFT JOIN coupon_types ct ON a.coupon_type_id = ct.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, message: '获取活动失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { name, description, coupon_type_id, start_time, end_time } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '活动名称必填' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO activities (id, name, description, coupon_type_id, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description, coupon_type_id || null, start_time || null, end_time || null);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ success: false, message: '创建活动失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  try {
    const { name, description, coupon_type_id, start_time, end_time, status } = req.body;

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    db.prepare(`
      UPDATE activities SET name = ?, description = ?, coupon_type_id = ?, start_time = ?, end_time = ?, status = ?
      WHERE id = ?
    `).run(
      name || activity.name, description ?? activity.description,
      coupon_type_id || activity.coupon_type_id, start_time || activity.start_time,
      end_time || activity.end_time, status || activity.status, req.params.id
    );

    const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ success: false, message: '更新活动失败' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    db.prepare("UPDATE activities SET status = 'deleted' WHERE id = ?").run(req.params.id);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ success: false, message: '删除活动失败' });
  }
});

router.post('/:id/claim', authenticate, (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND status = ?').get(req.params.id, 'active');

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    if (activity.start_time && new Date(activity.start_time) > new Date()) {
      return res.status(400).json({ success: false, message: '活动尚未开始' });
    }

    if (activity.end_time && new Date(activity.end_time) < new Date()) {
      return res.status(400).json({ success: false, message: '活动已结束' });
    }

    const existing = db.prepare('SELECT * FROM coupon_logs WHERE user_id = ? AND details LIKE ?').get(
      req.user.id, `%${req.params.id}%`
    );

    if (existing) {
      return res.status(400).json({ success: false, message: '您已领取过该活动的优惠券' });
    }

    if (!activity.coupon_type_id) {
      return res.status(400).json({ success: false, message: '活动暂无可领取的优惠券' });
    }

    const couponType = db.prepare('SELECT * FROM coupon_types WHERE id = ? AND status = ?').get(activity.coupon_type_id, 'active');

    if (!couponType || couponType.remain_count <= 0) {
      return res.status(400).json({ success: false, message: '优惠券已领完' });
    }

    const couponId = uuidv4();
    const code = 'AC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + couponType.valid_days * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO coupons (id, type_id, user_id, code, amount, min_amount, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unused', ?)
    `).run(couponId, couponType.id, req.user.id, code, couponType.amount, couponType.min_amount, expiresAt);

    db.prepare('UPDATE coupon_types SET remain_count = remain_count - 1 WHERE id = ?').run(couponType.id);

    db.prepare(`INSERT INTO coupon_logs (id, coupon_id, action, user_id, details) VALUES (?, ?, ?, ?, ?)`).run(
      uuidv4(), couponId, 'activity_claim', req.user.id,
      JSON.stringify({ activity_id: req.params.id, amount: couponType.amount })
    );

    res.json({
      success: true,
      data: {
        couponId,
        code,
        amount: couponType.amount,
        name: couponType.name,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Claim activity coupon error:', error);
    res.status(500).json({ success: false, message: '领取优惠券失败' });
  }
});

module.exports = router;
