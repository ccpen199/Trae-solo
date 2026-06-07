import express from 'express';
import db from '../db/index.js';
import { authenticate, requireRole } from '../middleware/oauth.js';
import { maskLocation } from '../utils/encryption.js';

const router = express.Router();

router.post('/report', authenticate, requireRole('rider'), (req, res) => {
  const { latitude, longitude, speed, heading, accuracy, order_id, lat, lng } = req.body;

  const final_lat = latitude || lat;
  const final_lng = longitude || lng;

  if (!final_lat || !final_lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const timestamp = Math.floor(Date.now() / 1000);

  db.prepare(`INSERT INTO gps_traces (user_id, order_id, latitude, longitude, speed, heading, accuracy, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    req.user.id, order_id || null, final_lat, final_lng, speed || null, heading || null, accuracy || null, timestamp
  );

  if (Math.random() < 0.1) {
    const masked = maskLocation(final_lat, final_lng);
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    db.prepare(`INSERT OR REPLACE INTO heatmap_data (area_code, record_date, hour_of_day, latitude, longitude, rider_count, order_count, intensity) VALUES (?, ?, ?, ?, ?, COALESCE((SELECT rider_count FROM heatmap_data WHERE latitude = ? AND longitude = ? LIMIT 1), 0) + 1, 0, 0.5)`).run(
      'default-area', today, hour, masked.lat, masked.lng, masked.lat, masked.lng
    );
  }

  res.json({ success: true, timestamp });
});

router.post('/batch', authenticate, requireRole('rider'), (req, res) => {
  const { traces } = req.body;

  if (!Array.isArray(traces) || traces.length === 0) {
    return res.status(400).json({ error: 'Invalid traces data' });
  }

  const insert = db.prepare(`INSERT INTO gps_traces (user_id, order_id, latitude, longitude, speed, heading, accuracy, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const transaction = db.transaction((traceList) => {
    for (const t of traceList) {
      insert.run(req.user.id, t.order_id || null, t.latitude, t.longitude, t.speed || null, t.heading || null, t.accuracy || null, t.timestamp || Math.floor(Date.now() / 1000));
    }
  });

  transaction(traces);
  res.json({ success: true, inserted: traces.length });
});

router.get('/trace/:orderId', authenticate, (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const order = db.prepare(`SELECT id, rider_id FROM orders WHERE id = ?`).get(orderId);

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const traces = db.prepare(`SELECT * FROM gps_traces WHERE order_id = ? ORDER BY timestamp ASC`).all(orderId);

  const masked = traces.map(t => ({
    ...t,
    ...maskLocation(t.latitude, t.longitude)
  }));

  res.json(masked);
});

router.get('/live', authenticate, requireRole('admin'), (req, res) => {
  const { limit = 50 } = req.query;
  const riders = db.prepare(`
    SELECT DISTINCT g.user_id, g.latitude, g.longitude, g.timestamp, u.real_name
    FROM gps_traces g
    JOIN users u ON g.user_id = u.id
    WHERE g.timestamp > ?
    GROUP BY g.user_id
    ORDER BY g.timestamp DESC
    LIMIT ?
  `).all(Math.floor(Date.now() / 1000) - 300, limit);

  const masked = riders.map(r => ({
    ...r,
    ...maskLocation(r.latitude, r.longitude)
  }));

  res.json(masked);
});

router.post('/track', authenticate, requireRole('rider'), (req, res) => {
  req.url = '/report';
  router.handle(req, res, () => {});
});

export default router;
