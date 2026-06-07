const express = require('express');
const { getDB } = require('../db/init');
const { verifyToken, requireRole } = require('../middleware/auth');
const { haversineDistance } = require('../services/dispatch');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const couriers = db.prepare(`
    SELECT cp.*, u.phone, u.name, u.credit_score, u.status as user_status
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    ORDER BY cp.created_at DESC
  `).all();
  res.json({ couriers });
});

router.get('/:id', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const profile = db.prepare(`
    SELECT cp.*, u.phone, u.name, u.credit_score, u.status as user_status
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ?
  `).get(req.params.id);

  if (!profile) {
    return res.status(404).json({ error: 'Courier profile not found' });
  }

  const blacklistEntry = db.prepare(`
    SELECT b.*, u.name as created_by_name
    FROM blacklist b
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
    LIMIT 1
  `).get(req.params.id);

  const whitelistEntry = db.prepare(`
    SELECT w.*, u.name as created_by_name
    FROM whitelist w
    LEFT JOIN users u ON w.created_by = u.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
    LIMIT 1
  `).get(req.params.id);

  const creditHistory = db.prepare(`
    SELECT * FROM (
      SELECT id, user_id, 'credit_adjust' as type, reason as description,
             score_change, created_at, created_by as operator
      FROM credit_adjustments
      WHERE user_id = ?
      UNION ALL
      SELECT o.id, o.courier_id as user_id, 'order' as type,
             CASE o.status
               WHEN 'completed' THEN '订单完成'
               WHEN 'cancelled' THEN '订单取消'
               WHEN 'timeout' THEN '订单超时'
               ELSE o.status
             END as description,
             CASE o.status
               WHEN 'completed' THEN 2
               WHEN 'timeout' THEN -5
               WHEN 'cancelled' THEN -3
               ELSE 0
             END as score_change,
             o.completed_at as created_at, NULL as operator
      FROM orders o
      WHERE o.courier_id = ? AND o.status IN ('completed', 'cancelled', 'timeout')
    ) ORDER BY created_at DESC
    LIMIT 20
  `).all(req.params.id, req.params.id);

  const recentOrders = db.prepare(`
    SELECT o.*, r.name as requester_name
    FROM orders o
    LEFT JOIN users r ON o.requester_id = r.id
    WHERE o.courier_id = ?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  const completedCount = recentOrders.filter(o => o.status === 'completed').length;
  const stats = {
    total_orders: profile.total_orders || 0,
    completed_orders: completedCount,
    cancelled_orders: recentOrders.filter(o => o.status === 'cancelled').length,
    timeout_orders: recentOrders.filter(o => o.status === 'timeout').length,
    avg_rating: profile.avg_rating || 0,
    fulfillment_rate: typeof profile.fulfillment_rate === 'number' && profile.fulfillment_rate > 1
      ? profile.fulfillment_rate
      : Math.round((profile.fulfillment_rate || 0) * 100),
  };

  const serviceAreas = profile.service_areas ? JSON.parse(profile.service_areas) : [];

  res.json({
    profile,
    blacklist: blacklistEntry || null,
    whitelist: whitelistEntry || null,
    credit_history: creditHistory,
    recent_orders: recentOrders,
    stats,
    service_areas: serviceAreas,
  });
});

router.get('/me', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const profile = db.prepare(`
    SELECT cp.*, u.phone, u.name, u.credit_score, u.status as user_status
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ?
  `).get(req.user.id);

  if (!profile) {
    return res.status(404).json({ error: 'Courier profile not found' });
  }
  res.json({ profile });
});

router.put('/me/location', verifyToken, requireRole('courier'), (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE courier_profiles SET latitude = ?, longitude = ?, updated_at = ?
    WHERE user_id = ?
  `).run(latitude, longitude, now, req.user.id);

  res.json({ latitude, longitude, updated_at: now });
});

router.put('/me/online', verifyToken, requireRole('courier'), (req, res) => {
  const { is_online } = req.body;
  if (is_online == null) {
    return res.status(400).json({ error: 'is_online required' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE courier_profiles SET is_online = ?, updated_at = ?
    WHERE user_id = ?
  `).run(is_online ? 1 : 0, now, req.user.id);

  res.json({ is_online: is_online ? 1 : 0, updated_at: now });
});

router.put('/:id/approve', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const profile = db.prepare('SELECT * FROM courier_profiles WHERE user_id = ?').get(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Courier profile not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE courier_profiles SET status = 'approved', updated_at = ?
    WHERE user_id = ?
  `).run(now, req.params.id);

  res.json({ user_id: req.params.id, status: 'approved', updated_at: now });
});

router.put('/:id/reject', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const profile = db.prepare('SELECT * FROM courier_profiles WHERE user_id = ?').get(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Courier profile not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE courier_profiles SET status = 'rejected', updated_at = ?
    WHERE user_id = ?
  `).run(now, req.params.id);

  res.json({ user_id: req.params.id, status: 'rejected', updated_at: now });
});

router.get('/nearby', verifyToken, (req, res) => {
  const { latitude, longitude, radius } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const maxDistance = parseFloat(radius) || 5;

  const db = getDB();
  const couriers = db.prepare(`
    SELECT cp.*, u.name
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.status = 'approved' AND cp.is_online = 1 AND cp.latitude IS NOT NULL
  `).all();

  const nearby = couriers.map(c => {
    const distance = haversineDistance(lat, lng, c.latitude, c.longitude);
    return { ...c, distance };
  }).filter(c => c.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  res.json({ couriers: nearby, center: { latitude: lat, longitude: lng }, radius: maxDistance });
});

module.exports = router;
