const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authMiddleware(['admin', 'operator', 'finance', 'anchor']), (req, res) => {
  const db = req.app.get('db');
  const { startTime, endTime } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  let dateFilter = '';
  const params = [];
  if (startTime) {
    dateFilter += ' AND o.created_at >= ?';
    params.push(startTime);
  }
  if (endTime) {
    dateFilter += ' AND o.created_at <= ?';
    params.push(endTime);
  }

  let userFilter = '';
  if (userRole === 'anchor') {
    userFilter = ' AND o.receiver_id = ' + userId;
  }

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
    FROM gift_orders o
    WHERE status = 'success' ${dateFilter} ${userFilter}
  `).get(...params);

  const failedOrders = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
    FROM gift_orders o
    WHERE status = 'failed' ${dateFilter} ${userFilter}
  `).get(...params);

  const giftSales = db.prepare(`
    SELECT g.id, g.name, g.icon, g.rarity, g.status as gift_status,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.quantity), 0) as total_quantity,
           COALESCE(SUM(o.total_amount), 0) as total_amount
    FROM gifts g
    LEFT JOIN gift_orders o ON g.id = o.gift_id AND o.status = 'success' ${dateFilter}
    GROUP BY g.id
    ORDER BY total_amount DESC
    LIMIT 10
  `).all(...params);

  const anchorIncome = db.prepare(`
    SELECT u.id, u.username, u.nickname,
           COUNT(o.id) as gift_count,
           COALESCE(SUM(o.quantity), 0) as total_quantity,
           COALESCE(SUM(o.total_amount), 0) as total_received,
           COUNT(DISTINCT o.user_id) as fan_count
    FROM users u
    LEFT JOIN gift_orders o ON u.id = o.receiver_id AND o.status = 'success' ${dateFilter}
    WHERE u.role = 'anchor'
    GROUP BY u.id
    ORDER BY total_received DESC
    LIMIT 10
  `).all(...params);

  const userStats = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as paying_users,
           COUNT(DISTINCT receiver_id) as receiving_users
    FROM gift_orders
    WHERE status = 'success' ${dateFilter} ${userFilter}
  `).get(...params);

  const dailyData = db.prepare(`
    SELECT DATE(o.created_at) as date,
           COUNT(*) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount,
           COUNT(DISTINCT o.user_id) as user_count
    FROM gift_orders o
    WHERE status = 'success' ${dateFilter} ${userFilter}
    GROUP BY DATE(o.created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);

  const giftStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM gifts
    GROUP BY status
  `).all();

  const activityStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM activities
    GROUP BY status
  `).all();

  const riskStats = db.prepare(`
    SELECT type, status, COUNT(*) as count
    FROM risk_records
    GROUP BY type, status
  `).all();

  const frozenStats = db.prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM frozen_income
    GROUP BY status
  `).all();

  const recentOrders = db.prepare(`
    SELECT o.*, 
           g.name as gift_name, g.icon as gift_icon,
           u.username as user_name, u.nickname as user_nickname,
           r.username as receiver_name, r.nickname as receiver_nickname,
           a.name as activity_name
    FROM gift_orders o
    LEFT JOIN gifts g ON o.gift_id = g.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users r ON o.receiver_id = r.id
    LEFT JOIN activities a ON o.activity_id = a.id
    WHERE 1=1 ${userFilter}
    ORDER BY o.id DESC
    LIMIT 10
  `).all();

  const activityEffectiveness = db.prepare(`
    SELECT a.id, a.name, a.type, a.status,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount
    FROM activities a
    LEFT JOIN gift_orders o ON a.id = o.activity_id AND o.status = 'success'
    GROUP BY a.id
    ORDER BY total_amount DESC
    LIMIT 5
  `).all();

  res.json({
    totalOrders,
    failedOrders,
    giftSales,
    anchorIncome,
    userStats,
    dailyData,
    giftStats,
    activityStats,
    riskStats,
    frozenStats,
    recentOrders,
    activityEffectiveness,
    currentUser: { id: userId, role: userRole }
  });
});

router.get('/gift-sales', authMiddleware(['admin', 'operator', 'finance']), (req, res) => {
  const db = req.app.get('db');
  const { giftId, startTime, endTime, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT g.id, g.name, g.icon, g.rarity, g.price,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.quantity), 0) as total_quantity,
           COALESCE(SUM(o.total_amount), 0) as total_amount,
           COUNT(DISTINCT o.user_id) as user_count
    FROM gifts g
    LEFT JOIN gift_orders o ON g.id = o.gift_id AND o.status = 'success'
    WHERE 1=1
  `;
  const params = [];

  if (giftId) {
    sql += ' AND g.id = ?';
    params.push(giftId);
  }
  if (startTime) {
    sql += ' AND o.created_at >= ?';
    params.push(startTime);
  }
  if (endTime) {
    sql += ' AND o.created_at <= ?';
    params.push(endTime);
  }

  sql += ' GROUP BY g.id ORDER BY total_amount DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const data = db.prepare(sql).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM gifts').get();

  res.json({ items: data, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/anchor-ranking', authMiddleware(['admin', 'operator', 'finance']), (req, res) => {
  const db = req.app.get('db');
  const { startTime, endTime, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT u.id, u.username, u.nickname, u.avatar,
           COUNT(o.id) as gift_count,
           COALESCE(SUM(o.quantity), 0) as total_gifts,
           COALESCE(SUM(o.total_amount), 0) as total_received,
           COUNT(DISTINCT o.user_id) as fan_count
    FROM users u
    LEFT JOIN gift_orders o ON u.id = o.receiver_id AND o.status = 'success'
    WHERE u.role = 'anchor'
  `;
  const params = [];

  if (startTime) {
    sql += ' AND o.created_at >= ?';
    params.push(startTime);
  }
  if (endTime) {
    sql += ' AND o.created_at <= ?';
    params.push(endTime);
  }

  sql += ' GROUP BY u.id ORDER BY total_received DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const data = db.prepare(sql).all(...params);
  const { total } = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'anchor'").get();

  res.json({ items: data, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/user-preference', authMiddleware(['admin', 'operator', 'finance']), (req, res) => {
  const db = req.app.get('db');

  const rarityStats = db.prepare(`
    SELECT g.rarity,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount
    FROM gifts g
    LEFT JOIN gift_orders o ON g.id = o.gift_id AND o.status = 'success'
    GROUP BY g.rarity
  `).all();

  const sceneStats = db.prepare(`
    SELECT o.scene,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount
    FROM gift_orders o
    WHERE o.status = 'success' AND o.scene IS NOT NULL
    GROUP BY o.scene
  `).all();

  res.json({ rarityStats, sceneStats });
});

router.get('/gift-detail/:id', authMiddleware(['admin', 'operator', 'finance']), (req, res) => {
  const db = req.app.get('db');
  const { startTime, endTime, status, page = 1, pageSize = 20 } = req.query;

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }

  let dateFilter = '';
  const params = [req.params.id];
  if (startTime) {
    dateFilter += ' AND o.created_at >= ?';
    params.push(startTime);
  }
  if (endTime) {
    dateFilter += ' AND o.created_at <= ?';
    params.push(endTime);
  }

  const statusFilter = status && status !== 'all' ? ' AND o.status = ?' : '';
  if (status && status !== 'all') {
    params.push(status);
  }

  const stats = db.prepare(`
    SELECT COUNT(o.id) as order_count,
           COALESCE(SUM(o.quantity), 0) as total_quantity,
           COALESCE(SUM(o.total_amount), 0) as total_amount,
           COUNT(DISTINCT o.user_id) as user_count,
           COUNT(DISTINCT o.receiver_id) as receiver_count
    FROM gift_orders o
    WHERE o.gift_id = ? ${statusFilter} ${dateFilter}
  `).get(...params);

  const failedStats = db.prepare(`
    SELECT COUNT(*) as failed_count,
           COALESCE(SUM(total_amount), 0) as failed_amount
    FROM gift_orders
    WHERE gift_id = ? AND status = 'failed' ${dateFilter}
  `).get(req.params.id, ...(startTime ? [startTime] : []), ...(endTime ? [endTime] : []));

  const activityStats = db.prepare(`
    SELECT a.id, a.name, a.type,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount
    FROM activities a
    LEFT JOIN gift_orders o ON a.id = o.activity_id AND o.gift_id = ? AND o.status = 'success' ${dateFilter}
    GROUP BY a.id
    ORDER BY total_amount DESC
  `).all(req.params.id, ...(startTime ? [startTime] : []), ...(endTime ? [endTime] : []));

  const countParams = [req.params.id];
  if (status && status !== 'all') countParams.push(status);
  if (startTime) countParams.push(startTime);
  if (endTime) countParams.push(endTime);

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM gift_orders o
    WHERE o.gift_id = ? ${statusFilter} ${dateFilter}
  `).get(...countParams);

  const orderParams = [...countParams, Number(pageSize), (Number(page) - 1) * Number(pageSize)];
  const orders = db.prepare(`
    SELECT o.*, 
           u.username as user_name, u.nickname as user_nickname,
           r.username as receiver_name, r.nickname as receiver_nickname,
           a.name as activity_name
    FROM gift_orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users r ON o.receiver_id = r.id
    LEFT JOIN activities a ON o.activity_id = a.id
    WHERE o.gift_id = ? ${statusFilter} ${dateFilter}
    ORDER BY o.id DESC LIMIT ? OFFSET ?
  `).all(...orderParams);

  res.json({ 
    gift, 
    stats: {
      ...stats,
      failed_count: failedStats.failed_count,
      failed_amount: failedStats.failed_amount
    }, 
    activityStats,
    orders, 
    total, 
    page: Number(page), 
    pageSize: Number(pageSize) 
  });
});

module.exports = router;
