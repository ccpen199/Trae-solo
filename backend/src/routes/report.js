const express = require('express');
const db = require('../db');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, requireRoles(['hq', 'manager', 'operation', 'finance']), (req, res) => {
  const { station_id, start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (req.user.role === 'manager') {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    whereClause += ' AND t.station_id = ?';
    params.push(user.station_id);
  } else if (station_id) {
    whereClause += ' AND t.station_id = ?';
    params.push(station_id);
  }
  
  if (start_date) {
    whereClause += ' AND DATE(t.end_time) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND DATE(t.end_time) <= ?';
    params.push(end_date);
  }
  
  const salesStats = db.prepare(`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(t.original_amount) as original_total,
      SUM(t.final_amount) as final_total,
      SUM(t.discount_amount) as discount_total,
      SUM(t.coupon_amount) as coupon_total,
      SUM(t.points_discount) as points_discount_total,
      SUM(t.points_earned) as points_total,
      SUM(t.volume) as volume_total,
      SUM(CASE WHEN t.member_id IS NOT NULL THEN 1 ELSE 0 END) as member_trans_count,
      SUM(CASE WHEN t.member_id IS NOT NULL THEN t.final_amount ELSE 0 END) as member_amount
    FROM transactions t
    ${whereClause}
  `).get(...params);
  
  const fuelStats = db.prepare(`
    SELECT 
      ft.id, ft.code, ft.name,
      SUM(t.volume) as volume,
      SUM(t.final_amount) as amount,
      COUNT(*) as count
    FROM transactions t
    JOIN fuel_types ft ON t.fuel_type_id = ft.id
    ${whereClause}
    GROUP BY ft.id
    ORDER BY amount DESC
  `).all(...params);
  
  const stationStats = db.prepare(`
    SELECT 
      s.id, s.name,
      SUM(t.volume) as volume,
      SUM(t.final_amount) as amount,
      COUNT(*) as count
    FROM transactions t
    JOIN stations s ON t.station_id = s.id
    ${whereClause}
    GROUP BY s.id
    ORDER BY amount DESC
  `).all(...params);
  
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const totalBalance = db.prepare('SELECT SUM(balance) as total FROM members').get().total;
  const totalPoints = db.prepare('SELECT SUM(points) as total FROM members').get().total;
  
  const memberRetention = db.prepare(`
    SELECT 
      COUNT(DISTINCT t.member_id) as active_members
    FROM transactions t
    ${whereClause} AND t.member_id IS NOT NULL
  `).get(...params);
  
  res.json({
    sales: salesStats,
    by_fuel: fuelStats,
    by_station: stationStats,
    member_count: memberCount,
    total_balance: totalBalance,
    total_points: totalPoints,
    active_members: memberRetention.active_members,
    member_rate: salesStats.transaction_count > 0 
      ? Math.round(salesStats.member_trans_count / salesStats.transaction_count * 10000) / 100 
      : 0
  });
});

router.get('/member-analysis', authenticate, requireRoles(['hq', 'operation', 'finance']), (req, res) => {
  const { days = 30 } = req.query;
  
  const membersByLevel = db.prepare(`
    SELECT 
      ml.id, ml.name, ml.discount_rate,
      COUNT(m.id) as member_count,
      SUM(m.balance) as total_balance,
      SUM(m.points) as total_points
    FROM member_levels ml
    LEFT JOIN members m ON m.level_id = ml.id
    GROUP BY ml.id
    ORDER BY ml.min_points
  `).all();
  
  const newMembers = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM members
    WHERE created_at >= DATE('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(`-${days} days`);
  
  const topMembers = db.prepare(`
    SELECT 
      m.id, m.phone, m.name, ml.name as level_name,
      SUM(t.final_amount) as total_spend,
      COUNT(t.id) as transaction_count,
      MAX(t.end_time) as last_visit
    FROM members m
    JOIN member_levels ml ON m.level_id = ml.id
    LEFT JOIN transactions t ON t.member_id = m.id
    WHERE t.end_time >= DATE('now', ?)
    GROUP BY m.id
    ORDER BY total_spend DESC
    LIMIT 10
  `).all(`-${days} days`);
  
  res.json({
    by_level: membersByLevel,
    new_members: newMembers,
    top_members: topMembers
  });
});

router.get('/coupon-analysis', authenticate, requireRoles(['hq', 'operation', 'finance']), (req, res) => {
  const coupons = db.prepare(`
    SELECT 
      c.id, c.code, c.name, c.type, c.value, c.total_issued,
      COUNT(mc.id) as total_used,
      SUM(CASE WHEN mc.status = 'available' THEN 1 ELSE 0 END) as available
    FROM coupons c
    LEFT JOIN member_coupons mc ON mc.coupon_id = c.id
    GROUP BY c.id
  `).all();
  
  const couponUsage = db.prepare(`
    SELECT 
      c.name,
      DATE(mc.used_at) as date,
      COUNT(*) as count,
      SUM(t.coupon_amount) as total_discount
    FROM member_coupons mc
    JOIN coupons c ON mc.coupon_id = c.id
    LEFT JOIN transactions t ON mc.transaction_id = t.id
    WHERE mc.status = 'used'
    GROUP BY c.id, DATE(mc.used_at)
    ORDER BY date DESC
    LIMIT 50
  `).all();
  
  res.json({ coupons, usage: couponUsage });
});

router.get('/daily-sales', authenticate, requireRoles(['hq', 'manager', 'operation', 'finance']), (req, res) => {
  const { station_id, days = 30 } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (req.user.role === 'manager') {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    whereClause += ' AND t.station_id = ?';
    params.push(user.station_id);
  } else if (station_id) {
    whereClause += ' AND t.station_id = ?';
    params.push(station_id);
  }
  
  whereClause += ' AND t.end_time >= DATE(\'now\', ?)';
  params.push(`-${days} days`);
  
  const daily = db.prepare(`
    SELECT 
      DATE(t.end_time) as date,
      COUNT(*) as transaction_count,
      SUM(t.volume) as volume,
      SUM(t.original_amount) as original_amount,
      SUM(t.final_amount) as final_amount,
      SUM(t.discount_amount + t.coupon_amount + t.points_discount) as discount_total
    FROM transactions t
    ${whereClause}
    GROUP BY DATE(t.end_time)
    ORDER BY date
  `).all(...params);
  
  res.json(daily);
});

router.get('/complaints', authenticate, requireRoles(['hq', 'manager', 'operation']), (req, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT c.*, m.phone, m.name as member_name, 
           t.final_amount, t.end_time as transaction_time,
           u.name as handler_name
    FROM complaints c
    JOIN members m ON c.member_id = m.id
    LEFT JOIN transactions t ON c.transaction_id = t.id
    LEFT JOIN users u ON c.handled_by = u.id
  `;
  const params = [];
  
  if (status) {
    sql += ' WHERE c.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.put('/complaints/:id/handle', authenticate, requireRoles(['hq', 'manager', 'operation']), (req, res) => {
  const { status, result } = req.body;
  if (!status) return res.status(400).json({ error: '请填写处理状态' });
  
  db.prepare(`
    UPDATE complaints 
    SET status = ?, result = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, result || '', req.user.id, req.params.id);
  
  res.json({ message: '处理完成' });
});

router.get('/invoices', authenticate, requireRoles(['hq', 'finance', 'manager']), (req, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT i.*, m.phone, m.name as member_name,
           t.final_amount as transaction_amount, t.end_time as transaction_time,
           s.name as station_name
    FROM invoices i
    JOIN members m ON i.member_id = m.id
    JOIN transactions t ON i.transaction_id = t.id
    JOIN stations s ON t.station_id = s.id
  `;
  const params = [];
  
  if (status) {
    sql += ' WHERE i.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY i.created_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.put('/invoices/:id/issue', authenticate, requireRoles(['hq', 'finance', 'manager']), (req, res) => {
  const { invoice_number } = req.body;
  
  if (!invoice_number || !invoice_number.trim()) {
    return res.status(400).json({ error: '发票号不能为空' });
  }
  
  const trimmedInvoiceNum = invoice_number.trim();
  
  const existing = db.prepare('SELECT id FROM invoices WHERE invoice_number = ? AND id != ?').get(trimmedInvoiceNum, req.params.id);
  if (existing) {
    return res.status(400).json({ error: '该发票号已存在，请使用其他发票号' });
  }
  
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: '发票申请不存在' });
  }
  if (invoice.status === 'issued') {
    return res.status(400).json({ error: '该发票已开具' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE invoices 
      SET status = 'issued', invoice_number = ?, issued_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(trimmedInvoiceNum, req.params.id);
    
    db.prepare('UPDATE transactions SET invoice_status = ? WHERE id = ?').run('issued', invoice.transaction_id);
  });
  tx();
  
  res.json({ message: '发票已开具' });
});

module.exports = router;
