const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');

router.get('/overview', authenticate, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayStats = db.prepare('SELECT * FROM statistics WHERE date = ?').get(today) || {
      share_count: 0, open_count: 0, receive_count: 0, new_user_count: 0,
      return_count: 0, download_count: 0, use_count: 0, activate_count: 0, order_count: 0
    };

    const weekStats = db.prepare(`
      SELECT
        SUM(share_count) as share_count,
        SUM(open_count) as open_count,
        SUM(receive_count) as receive_count,
        SUM(new_user_count) as new_user_count,
        SUM(return_count) as return_count,
        SUM(download_count) as download_count,
        SUM(use_count) as use_count,
        SUM(activate_count) as activate_count,
        SUM(order_count) as order_count
      FROM statistics WHERE date >= ?
    `).get(weekAgo);

    const monthStats = db.prepare(`
      SELECT
        SUM(share_count) as share_count,
        SUM(open_count) as open_count,
        SUM(receive_count) as receive_count,
        SUM(new_user_count) as new_user_count,
        SUM(return_count) as return_count,
        SUM(download_count) as download_count,
        SUM(use_count) as use_count,
        SUM(activate_count) as activate_count,
        SUM(order_count) as order_count
      FROM statistics WHERE date >= ?
    `).get(monthAgo);

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalCoupons = db.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('paid').count;

    const couponUsage = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused
      FROM coupons
    `).get();

    const shareStats = db.prepare(`
      SELECT
        COUNT(*) as total_shares,
        SUM(receive_count) as total_received
      FROM shares
    `).get();

    const rates = {
      shareRate: shareStats.total_shares > 0 ? (shareStats.total_received / shareStats.total_shares * 100).toFixed(2) : 0,
      couponUsageRate: couponUsage.total > 0 ? (couponUsage.used / couponUsage.total * 100).toFixed(2) : 0,
      conversionRate: totalUsers > 0 ? (totalOrders / totalUsers * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: {
        today: todayStats,
        week: weekStats,
        month: monthStats,
        totals: {
          users: totalUsers,
          coupons: totalCoupons,
          orders: totalOrders
        },
        usage: couponUsage,
        share: shareStats,
        rates
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

router.get('/daily', authenticate, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dailyStats = db.prepare(`
      SELECT * FROM statistics WHERE date >= ? ORDER BY date ASC
    `).all(startDate);

    res.json({ success: true, data: dailyStats });
  } catch (error) {
    console.error('Get daily statistics error:', error);
    res.status(500).json({ success: false, message: '获取每日统计失败' });
  }
});

router.post('/record', authenticate, (req, res) => {
  try {
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: '动作类型必填' });
    }

    const columns = {
      'open': 'open_count',
      'receive': 'receive_count',
      'use': 'use_count',
      'activate': 'activate_count',
      'return': 'return_count',
      'download': 'download_count'
    };

    const column = columns[action];
    if (column) {
      const existingStat = db.prepare("SELECT id FROM statistics WHERE date = date('now')").get();
      if (existingStat) {
        db.prepare(`UPDATE statistics SET ${column} = ${column} + 1 WHERE id = ?`).run(existingStat.id);
      } else {
        db.prepare(`INSERT INTO statistics (id, date, ${column}) VALUES (?, date('now'), 1)`).run(uuidv4());
      }
    }

    db.prepare(`INSERT INTO coupon_logs (id, action, user_id, details) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), action, req.user.id, JSON.stringify(details || {})
    );

    res.json({ success: true, message: '记录成功' });
  } catch (error) {
    console.error('Record action error:', error);
    res.status(500).json({ success: false, message: '记录动作失败' });
  }
});

module.exports = router;
