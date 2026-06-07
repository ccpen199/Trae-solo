import express from 'express';
import { db } from '../database.js';

const router = express.Router();

function getDashboardOverview() {
  const boxOfficeSummary = db.prepare(`
    SELECT
      COUNT(DISTINCT id) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COUNT(DISTINCT user_id) as total_buyers,
      COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM orders
    WHERE status = 'paid'
  `).get();

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get();
  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
  const availableSeats = db.prepare(`
    SELECT COUNT(*) as count
    FROM session_seats
    WHERE status = 'available'
  `).get();
  const recentOrders = db.prepare(`
    SELECT o.id, o.status, o.total_amount, o.created_at, e.title as event_title
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    ORDER BY o.created_at DESC
    LIMIT 8
  `).all();

  return {
    stats: {
      totalOrders: boxOfficeSummary.total_orders || 0,
      totalRevenue: boxOfficeSummary.total_revenue || 0,
      totalBuyers: boxOfficeSummary.total_buyers || 0,
      avgOrderValue: boxOfficeSummary.avg_order_value || 0,
      totalUsers: totalUsers.count || 0,
      totalEvents: totalEvents.count || 0,
      totalSessions: totalSessions.count || 0,
      availableSeats: availableSeats.count || 0,
    },
    recentOrders,
  };
}

router.get('/stats', (req, res) => {
  res.json(getDashboardOverview());
});

router.get('/dashboard', (req, res) => {
  res.json(getDashboardOverview());
});

router.get('/dashboard/box-office', (req, res) => {
  const { city, start_date, end_date, group_by = 'day' } = req.query;
  
  let dateFormat = '%Y-%m-%d';
  if (group_by === 'month') dateFormat = '%Y-%m';
  if (group_by === 'city') dateFormat = '%Y-%m-%d';
  
  let query = `
    SELECT
      strftime(?, o.payment_time) as period,
      COUNT(DISTINCT o.id) as order_count,
      SUM(o.total_amount) as total_revenue,
      COUNT(DISTINCT o.user_id) as buyer_count,
      e.type,
      v.city
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    JOIN venues v ON v.id = s.venue_id
    WHERE o.status = 'paid'
  `;
  let params = [dateFormat];
  
  if (city) {
    query += ' AND v.city = ?';
    params.push(city);
  }
  
  if (start_date) {
    query += ' AND o.payment_time >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND o.payment_time <= ?';
    params.push(end_date);
  }
  
  if (group_by === 'city') {
    query += ' GROUP BY v.city ORDER BY total_revenue DESC';
  } else if (group_by === 'event') {
    query += ' GROUP BY e.id ORDER BY total_revenue DESC';
  } else {
    query += ' GROUP BY period ORDER BY period DESC';
  }
  
  const data = db.prepare(query).all(...params);
  
  const summary = db.prepare(`
    SELECT
      COUNT(DISTINCT o.id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      COUNT(DISTINCT o.user_id) as total_buyers,
      AVG(o.total_amount) as avg_order_value
    FROM orders o
    WHERE o.status = 'paid'
  `).get();
  
  res.json({ data, summary });
});

router.get('/dashboard/audience', (req, res) => {
  const purchaseFrequency = db.prepare(`
    SELECT
      CASE
        WHEN order_count = 1 THEN '1次'
        WHEN order_count BETWEEN 2 AND 5 THEN '2-5次'
        WHEN order_count BETWEEN 6 AND 10 THEN '6-10次'
        ELSE '10次以上'
      END as frequency,
      COUNT(*) as user_count
    FROM (
      SELECT user_id, COUNT(*) as order_count
      FROM orders WHERE status = 'paid'
      GROUP BY user_id
    )
    GROUP BY frequency
  `).all();
  
  const priceSensitivity = db.prepare(`
    SELECT
      CASE
        WHEN price_sensitivity < 0.3 THEN '低敏感度'
        WHEN price_sensitivity < 0.7 THEN '中敏感度'
        ELSE '高敏感度'
      END as sensitivity_level,
      COUNT(*) as user_count,
      AVG(total_spent) as avg_spent
    FROM users
    GROUP BY sensitivity_level
  `).all();
  
  const categoryMigration = db.prepare(`
    SELECT
      e1.type as from_type,
      e2.type as to_type,
      COUNT(DISTINCT o1.user_id) as user_count
    FROM orders o1
    JOIN orders o2 ON o1.user_id = o2.user_id AND o1.id < o2.id
    JOIN sessions s1 ON s1.id = o1.session_id
    JOIN sessions s2 ON s2.id = o2.session_id
    JOIN events e1 ON e1.id = s1.event_id
    JOIN events e2 ON e2.id = s2.event_id
    WHERE o1.status = 'paid' AND o2.status = 'paid'
    GROUP BY e1.type, e2.type
    HAVING user_count > 0
  `).all();
  
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const activeUsers = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE status = 'paid'
  `).get();
  
  res.json({
    purchase_frequency: purchaseFrequency,
    price_sensitivity: priceSensitivity,
    category_migration: categoryMigration,
    total_users: totalUsers.count,
    active_users: activeUsers.count
  });
});

router.get('/dashboard/risk', (req, res) => {
  const riskLevelStats = db.prepare(`
    SELECT
      CASE risk_level
        WHEN 0 THEN '正常'
        WHEN 1 THEN '低风险'
        WHEN 2 THEN '中风险'
        ELSE '高风险'
      END as risk_level,
      COUNT(*) as user_count
    FROM users
    GROUP BY risk_level
  `).all();
  
  const recentRisks = db.prepare(`
    SELECT ur.*, u.nickname, u.phone
    FROM user_risk_records ur
    JOIN users u ON u.id = ur.user_id
    ORDER BY ur.created_at DESC
    LIMIT 20
  `).all();
  
  const suspiciousOrders = db.prepare(`
    SELECT o.*, u.nickname, u.phone, u.risk_level,
           e.title as event_title
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    WHERE u.risk_level >= 2
    ORDER BY o.created_at DESC
    LIMIT 20
  `).all();
  
  res.json({
    risk_level_stats: riskLevelStats,
    recent_risks: recentRisks,
    suspicious_orders: suspiciousOrders
  });
});

router.get('/marketing/ab-tests', (req, res) => {
  const activities = db.prepare(`
    SELECT a.*,
           COUNT(g.id) as group_count
    FROM marketing_activities a
    LEFT JOIN ab_test_groups g ON g.activity_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all();
  
  activities.forEach(a => {
    a.config = a.config ? JSON.parse(a.config) : null;
  });
  
  res.json(activities);
});

router.get('/marketing/ab-tests/:id', (req, res) => {
  const activity = db.prepare('SELECT * FROM marketing_activities WHERE id = ?').get(req.params.id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });
  
  activity.config = activity.config ? JSON.parse(activity.config) : null;
  
  const groups = db.prepare('SELECT * FROM ab_test_groups WHERE activity_id = ?').all(req.params.id);
  groups.forEach(g => {
    g.config = g.config ? JSON.parse(g.config) : null;
    g.conversion_rate = g.click_count > 0 ? (g.conversion_count / g.click_count * 100).toFixed(2) + '%' : '0%';
  });
  
  activity.groups = groups;
  res.json(activity);
});

router.get('/inventory/sync', (req, res) => {
  const syncs = db.prepare(`
    SELECT i.*, e.title as event_title, s.start_time
    FROM inventory_sync i
    JOIN sessions s ON s.id = i.session_id
    JOIN events e ON e.id = s.event_id
    ORDER BY i.last_sync_time DESC
    LIMIT 50
  `).all();
  
  res.json(syncs);
});

router.post('/risk/users/:id/flag', (req, res) => {
  const { risk_level, reason, risk_score } = req.body;
  const userId = req.params.id;
  
  db.prepare('UPDATE users SET risk_level = ? WHERE id = ?').run(risk_level || 1, userId);
  
  db.prepare(`
    INSERT INTO user_risk_records (id, user_id, risk_type, risk_score, details)
    VALUES (?, ?, 'manual_flag', ?, ?)
  `).run(Math.random().toString(36).substring(2, 15), userId, risk_score || 50, reason || '');
  
  res.json({ success: true });
});

export default router;
