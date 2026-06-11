const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  const activeDeviceCount = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'active'").get().count;
  const rideCount = db.prepare('SELECT COUNT(*) as count FROM ride_records').get().count;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingTopics = db.prepare("SELECT COUNT(*) as count FROM topics WHERE status = 'pending'").get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != ?').get('cancelled').total;
  const totalNcoins = db.prepare('SELECT COALESCE(SUM(n_coins), 0) as total FROM users').get().total;

  res.json({
    stats: {
      user_count: userCount,
      device_count: deviceCount,
      active_device_count: activeDeviceCount,
      ride_count: rideCount,
      order_count: orderCount,
      pending_topics: pendingTopics,
      total_revenue: totalRevenue,
      total_ncoins: totalNcoins
    }
  });
});

router.get('/users', (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  const users = db.prepare(`
    SELECT id, username, email, nickname, avatar, phone, n_coins, role, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(parseInt(page_size), parseInt(offset));

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  res.json({ users, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/devices', (req, res) => {
  const { page = 1, page_size = 20, status } = req.query;
  const offset = (page - 1) * page_size;

  let query = `
    SELECT d.*, u.username as owner_name 
    FROM devices d 
    LEFT JOIN users u ON d.user_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), parseInt(offset));

  const devices = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;

  res.json({ devices, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/topics/pending', (req, res) => {
  const topics = db.prepare(`
    SELECT t.*, u.username, u.nickname 
    FROM topics t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'pending'
    ORDER BY t.created_at ASC
  `).all();

  res.json({ topics });
});

router.put('/topics/:id/approve', (req, res) => {
  db.prepare("UPDATE topics SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.json({ status: 'ok' });
});

router.put('/topics/:id/reject', (req, res) => {
  const { reason } = req.body;
  db.prepare("UPDATE topics SET status = 'rejected' WHERE id = ?").run(req.params.id);
  res.json({ status: 'ok', reason });
});

router.post('/firmware', (req, res) => {
  const { version, model, file_url, changelog, size, md5, is_forced } = req.body;

  if (!version || !model) {
    return res.status(400).json({ error: 'Version and model are required' });
  }

  const result = db.prepare(`
    INSERT INTO firmware_versions (version, model, file_url, changelog, size, md5, is_forced)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(version, model, file_url || null, changelog || null, size || null, md5 || null, is_forced ? 1 : 0);

  const firmware = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ firmware });
});

router.get('/firmware', (req, res) => {
  const { model } = req.query;
  
  let query = 'SELECT * FROM firmware_versions';
  const params = [];

  if (model) {
    query += ' WHERE model = ?';
    params.push(model);
  }

  query += ' ORDER BY released_at DESC';
  const firmwares = db.prepare(query).all(...params);

  res.json({ firmwares });
});

router.get('/service-orders', (req, res) => {
  const { status } = req.query;
  
  let query = `
    SELECT so.*, u.username, d.vin, d.model, s.name as shop_name
    FROM service_orders so
    JOIN users u ON so.user_id = u.id
    JOIN devices d ON so.device_id = d.id
    LEFT JOIN service_shops s ON so.shop_id = s.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE so.status = ?';
    params.push(status);
  }

  query += ' ORDER BY so.created_at DESC';
  const orders = db.prepare(query).all(...params);

  res.json({ orders });
});

module.exports = router;
