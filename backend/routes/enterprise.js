const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { autoDispatch } = require('../services/dispatch');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required in X-Api-Key header' });
  }

  const db = getDB();
  const client = db.prepare('SELECT * FROM enterprise_clients WHERE api_key = ? AND status = \'active\'').get(apiKey);
  if (!client) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.enterprise = client;
  next();
}

router.post('/auth', (req, res) => {
  const { api_key, api_secret } = req.body;
  if (!api_key || !api_secret) {
    return res.status(400).json({ error: 'api_key and api_secret required' });
  }

  const db = getDB();
  const client = db.prepare('SELECT * FROM enterprise_clients WHERE api_key = ? AND api_secret = ? AND status = \'active\'').get(api_key, api_secret);
  if (!client) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: client.id, name: client.name, type: 'enterprise' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, client: { id: client.id, name: client.name, monthly_quota: client.monthly_quota, used_quota: client.used_quota } });
});

router.post('/orders', verifyApiKey, (req, res) => {
  const db = getDB();

  if (req.enterprise.used_quota >= req.enterprise.monthly_quota) {
    return res.status(429).json({ error: 'Monthly quota exceeded' });
  }

  const {
    type, title, description,
    pickup_address, pickup_latitude, pickup_longitude,
    delivery_address, delivery_latitude, delivery_longitude,
    purchase_items, estimated_duration, fee, reward,
    priority, require_photo, require_signature
  } = req.body;

  if (!type || !title || !pickup_address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const order_no = 'ENT' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const duration = estimated_duration || 60;
  const deadline = new Date(Date.now() + duration * 60 * 1000).toISOString();

  const requester = db.prepare('SELECT id FROM users WHERE role = \'admin\' LIMIT 1').get();

  db.prepare(`
    INSERT INTO orders (id, order_no, type, requester_id, courier_id, priority, status, title, description,
      pickup_address, pickup_latitude, pickup_longitude, delivery_address, delivery_latitude, delivery_longitude,
      purchase_items, estimated_duration, deadline, fee, reward, require_photo, require_signature,
      assigned_at, accepted_at, arrived_at, started_at, completed_at, cancelled_at, cancel_reason, timeout_at,
      created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)
  `).run(
    id, order_no, type, requester ? requester.id : 'enterprise', priority || 0, title, description,
    pickup_address, pickup_latitude || null, pickup_longitude || null,
    delivery_address || null, delivery_latitude || null, delivery_longitude || null,
    purchase_items ? JSON.stringify(purchase_items) : null,
    duration, deadline, fee || 0, reward || 0,
    require_signature ? 1 : 1, require_signature ? 1 : 0,
    now, now
  );

  db.prepare('UPDATE enterprise_clients SET used_quota = used_quota + 1, updated_at = ? WHERE id = ?').run(now, req.enterprise.id);

  const dispatchResult = autoDispatch(id);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json({ order, dispatch: dispatchResult });
});

router.get('/orders', verifyApiKey, (req, res) => {
  const db = getDB();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM orders WHERE order_no LIKE \'ENT%\'';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

router.get('/orders/:id', verifyApiKey, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND order_no LIKE \'ENT%\'').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ order, tracking });
});

module.exports = router;
