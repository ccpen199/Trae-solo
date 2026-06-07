const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();

  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const activeCouriers = db.prepare('SELECT COUNT(*) as count FROM courier_profiles WHERE is_online = 1 AND status = \'approved\'').get().count;

  const completedOrders = db.prepare('SELECT * FROM orders WHERE status = \'completed\' AND completed_at IS NOT NULL AND created_at IS NOT NULL').all();
  let avgFulfillmentMinutes = 0;
  if (completedOrders.length > 0) {
    const totalMinutes = completedOrders.reduce((sum, o) => {
      const created = new Date(o.created_at).getTime();
      const completed = new Date(o.completed_at).getTime();
      return sum + (completed - created) / 60000;
    }, 0);
    avgFulfillmentMinutes = Math.round(totalMinutes / completedOrders.length);
  }

  const timeoutCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = \'timeout\'').get().count;
  const timeoutRate = totalOrders > 0 ? (timeoutCount / totalOrders * 100).toFixed(2) : '0.00';

  const ordersByType = db.prepare('SELECT type, COUNT(*) as count FROM orders GROUP BY type').all();
  const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all();

  const heatMap = db.prepare('SELECT district, center_latitude, center_longitude, heat_level, active_couriers, pending_orders FROM service_areas').all();

  res.json({
    totalOrders,
    activeCouriers,
    avgFulfillmentMinutes,
    timeoutRate: parseFloat(timeoutRate),
    ordersByType,
    ordersByStatus,
    recentOrders,
    heatMap
  });
});

router.get('/orders', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT o.*,
           r.name as requester_name,
           c.name as courier_name
    FROM orders o
    LEFT JOIN users r ON o.requester_id = r.id
    LEFT JOIN users c ON o.courier_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND o.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
  const countParams = [];
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  if (type) { countSql += ' AND type = ?'; countParams.push(type); }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ orders, total, page: Number(page), limit: Number(limit) });
});

router.get('/couriers', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const couriers = db.prepare(`
    SELECT cp.*, u.phone, u.name, u.credit_score, u.status as user_status
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    ORDER BY cp.created_at DESC
  `).all();
  res.json({ couriers });
});

router.get('/credit-rules', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const rules = db.prepare('SELECT * FROM credit_rules ORDER BY created_at').all();
  res.json({ rules });
});

router.post('/credit-rules', verifyToken, requireRole('admin'), (req, res) => {
  const { action, score_change, description } = req.body;
  if (!action || score_change == null) {
    return res.status(400).json({ error: 'Action and score_change required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO credit_rules (id, action, score_change, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, action, score_change, description || '', now);

  res.status(201).json({ rule: { id, action, score_change, description, created_at: now } });
});

router.put('/credit-rules/:id', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM credit_rules WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Credit rule not found' });
  }

  const { action, score_change, description } = req.body;
  db.prepare(`
    UPDATE credit_rules
    SET action = COALESCE(?, action),
        score_change = COALESCE(?, score_change),
        description = COALESCE(?, description)
    WHERE id = ?
  `).run(action || null, score_change != null ? score_change : null, description || null, req.params.id);

  const updated = db.prepare('SELECT * FROM credit_rules WHERE id = ?').get(req.params.id);
  res.json({ rule: updated });
});

router.get('/blacklist', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const list = db.prepare(`
    SELECT b.*, u.name, u.phone
    FROM blacklist b
    JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
  `).all();
  res.json({ blacklist: list });
});

router.post('/blacklist', verifyToken, requireRole('admin'), (req, res) => {
  const { user_id, reason } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO blacklist (id, user_id, reason, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user_id, reason || '', req.user.id, now);

  db.prepare('UPDATE users SET status = \'blacklisted\', updated_at = ? WHERE id = ?').run(now, user_id);

  res.status(201).json({ blacklist: { id, user_id, reason, created_by: req.user.id, created_at: now } });
});

router.delete('/blacklist/:id', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const entry = db.prepare('SELECT * FROM blacklist WHERE id = ?').get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Blacklist entry not found' });
  }

  db.prepare('DELETE FROM blacklist WHERE id = ?').run(req.params.id);
  db.prepare('UPDATE users SET status = \'active\', updated_at = ? WHERE id = ?').run(new Date().toISOString(), entry.user_id);

  res.json({ message: 'Removed from blacklist' });
});

router.get('/whitelist', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const list = db.prepare(`
    SELECT w.*, u.name, u.phone
    FROM whitelist w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `).all();
  res.json({ whitelist: list });
});

router.post('/whitelist', verifyToken, requireRole('admin'), (req, res) => {
  const { user_id, reason } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO whitelist (id, user_id, reason, created_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user_id, reason || '', req.user.id, now);

  res.status(201).json({ whitelist: { id, user_id, reason, created_by: req.user.id, created_at: now } });
});

router.delete('/whitelist/:id', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const entry = db.prepare('SELECT * FROM whitelist WHERE id = ?').get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Whitelist entry not found' });
  }

  db.prepare('DELETE FROM whitelist WHERE id = ?').run(req.params.id);
  res.json({ message: 'Removed from whitelist' });
});

router.get('/quality-rules', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const rules = db.prepare('SELECT * FROM quality_rules ORDER BY order_type, created_at').all();
  res.json({ rules });
});

router.post('/quality-rules', verifyToken, requireRole('admin'), (req, res) => {
  const { order_type, rule_name, rule_key, required, description } = req.body;
  if (!order_type || !rule_name || !rule_key) {
    return res.status(400).json({ error: 'order_type, rule_name, and rule_key required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO quality_rules (id, order_type, rule_name, rule_key, required, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, order_type, rule_name, rule_key, required != null ? (required ? 1 : 0) : 1, description || '', now, now);

  res.status(201).json({ rule: { id, order_type, rule_name, rule_key, required: required != null ? required : true, description, created_at: now, updated_at: now } });
});

router.put('/quality-rules/:id', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM quality_rules WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Quality rule not found' });
  }

  const { order_type, rule_name, rule_key, required, description } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE quality_rules SET
      order_type = COALESCE(?, order_type),
      rule_name = COALESCE(?, rule_name),
      rule_key = COALESCE(?, rule_key),
      required = COALESCE(?, required),
      description = COALESCE(?, description),
      updated_at = ?
    WHERE id = ?
  `).run(order_type || null, rule_name || null, rule_key || null, required != null ? (required ? 1 : 0) : null, description || null, now, req.params.id);

  const updated = db.prepare('SELECT * FROM quality_rules WHERE id = ?').get(req.params.id);
  res.json({ rule: updated });
});

router.get('/service-areas', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const areas = db.prepare('SELECT * FROM service_areas ORDER BY city, district').all();
  res.json({ areas });
});

router.put('/credit/:userId', verifyToken, requireRole('admin'), (req, res) => {
  const { score_change, reason } = req.body;
  if (score_change == null) {
    return res.status(400).json({ error: 'score_change required' });
  }

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newScore = Math.max(0, Math.min(200, user.credit_score + score_change));
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET credit_score = ?, updated_at = ? WHERE id = ?').run(newScore, now, req.params.userId);

  res.json({ user_id: req.params.userId, previous_score: user.credit_score, score_change, new_score: newScore, reason: reason || '' });
});

router.get('/timeout-alerts', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const now = new Date().toISOString();

  const timeoutOrders = db.prepare(`
    SELECT * FROM orders
    WHERE status IN ('timeout', 'cancelled')
      AND (timeout_at IS NOT NULL OR cancel_reason LIKE '%超时%')
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  const nearDeadline = db.prepare(`
    SELECT * FROM orders
    WHERE status IN ('dispatched', 'accepted', 'arrived', 'in_progress')
      AND deadline < ?
    ORDER BY deadline ASC
    LIMIT 50
  `).all(new Date(Date.now() + 15 * 60 * 1000).toISOString());

  res.json({ timeoutOrders, nearDeadline });
});

router.get('/fulfillment-stats', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();

  const completedOrders = db.prepare(`
    SELECT * FROM orders
    WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1000
  `).all();

  let totalMinutes = 0;
  let count = 0;
  const byType = {};

  for (const o of completedOrders) {
    const created = new Date(o.created_at).getTime();
    const completed = new Date(o.completed_at).getTime();
    const minutes = (completed - created) / 60000;

    totalMinutes += minutes;
    count++;

    if (!byType[o.type]) {
      byType[o.type] = { total: 0, count: 0 };
    }
    byType[o.type].total += minutes;
    byType[o.type].count++;
  }

  const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;
  const targetMinutes = 37;
  const withinTarget = completedOrders.filter(o => {
    const minutes = (new Date(o.completed_at) - new Date(o.created_at)) / 60000;
    return minutes <= targetMinutes;
  }).length;
  const targetRate = count > 0 ? (withinTarget / count * 100).toFixed(2) : '0.00';

  const typeStats = {};
  for (const [type, data] of Object.entries(byType)) {
    typeStats[type] = {
      avg_minutes: Math.round(data.total / data.count),
      count: data.count
    };
  }

  res.json({
    avgFulfillmentMinutes: avgMinutes,
    targetMinutes,
    targetRate: parseFloat(targetRate),
    totalCompleted: count,
    withinTarget,
    typeStats
  });
});

module.exports = router;
