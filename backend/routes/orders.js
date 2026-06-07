const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { verifyToken, requireRole } = require('../middleware/auth');
const { autoDispatch } = require('../services/dispatch');

const router = express.Router();

function generateOrderNo() {
  const now = new Date();
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD${date}${seq}`;
}

router.post('/', verifyToken, requireRole('requester', 'admin'), (req, res) => {
  const {
    type, title, description,
    pickup_address, pickup_latitude, pickup_longitude,
    delivery_address, delivery_latitude, delivery_longitude,
    purchase_items, queue_location, estimated_duration, fee, reward,
    priority, require_photo, require_signature
  } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDB();
  const now = new Date().toISOString();
  const id = uuidv4();
  const order_no = generateOrderNo();
  const duration = estimated_duration || 60;
  const deadline = new Date(Date.now() + duration * 60 * 1000).toISOString();
  const priorityMap = { normal: 0, urgent: 1, critical: 2 };
  const normalizedPriority = typeof priority === 'string'
    ? (priorityMap[priority] ?? 0)
    : Number(priority || 0);
  const normalizedPickupAddress =
    pickup_address || queue_location || (type === 'purchase' ? '就近商超/药店代购' : '用户指定服务地点');
  const normalizedDeliveryAddress =
    delivery_address || (type === 'purchase' ? '需求方收货地址待确认' : null);
  const normalizedPickupLatitude = pickup_latitude ?? 22.5431;
  const normalizedPickupLongitude = pickup_longitude ?? 114.0579;
  const normalizedDeliveryLatitude = delivery_latitude ?? null;
  const normalizedDeliveryLongitude = delivery_longitude ?? null;
  const normalizedPurchaseItems = Array.isArray(purchase_items)
    ? JSON.stringify(purchase_items)
    : (purchase_items || null);

  db.prepare(`
    INSERT INTO orders (id, order_no, type, requester_id, courier_id, priority, status, title, description,
      pickup_address, pickup_latitude, pickup_longitude, delivery_address, delivery_latitude, delivery_longitude,
      purchase_items, estimated_duration, deadline, fee, reward, require_photo, require_signature,
      assigned_at, accepted_at, arrived_at, started_at, completed_at, cancelled_at, cancel_reason, timeout_at,
      created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)
  `).run(
    id, order_no, type, req.user.id, normalizedPriority, title, description,
    normalizedPickupAddress, normalizedPickupLatitude, normalizedPickupLongitude, normalizedDeliveryAddress,
    normalizedDeliveryLatitude, normalizedDeliveryLongitude,
    normalizedPurchaseItems,
    duration, deadline, fee || 0, reward || 0,
    require_photo ? 1 : 0, require_signature ? 1 : 0,
    now, now
  );

  const dispatchResult = autoDispatch(id);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json({ order, dispatch: dispatchResult });
});

router.get('/', verifyToken, (req, res) => {
  const db = getDB();
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (req.user.role === 'requester') {
    sql += ' AND requester_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'courier') {
    sql += ' AND courier_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
  const countParams = [];
  if (req.user.role === 'requester') {
    countSql += ' AND requester_id = ?';
    countParams.push(req.user.id);
  } else if (req.user.role === 'courier') {
    countSql += ' AND courier_id = ?';
    countParams.push(req.user.id);
  }
  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  if (type) {
    countSql += ' AND type = ?';
    countParams.push(type);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ orders, total, page: Number(page), limit: Number(limit) });
});

router.get('/available', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const { type } = req.query;

  let sql = "SELECT * FROM orders WHERE status IN ('pending', 'dispatched')";
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY priority DESC, created_at ASC LIMIT 50';

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

router.get('/my-tasks', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const { status } = req.query;

  let sql = 'SELECT * FROM orders WHERE courier_id = ?';
  const params = [req.user.id];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  } else {
    sql += " AND status IN ('dispatched','accepted','arrived','in_progress','completed')";
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

router.get('/:id', verifyToken, (req, res) => {
  const db = getDB();
  const order = db.prepare(`
    SELECT o.*,
           r.name as requester_name, r.phone as requester_phone,
           c.name as courier_name, c.phone as courier_phone
    FROM orders o
    LEFT JOIN users r ON o.requester_id = r.id
    LEFT JOIN users c ON o.courier_id = c.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role === 'requester' && order.requester_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'courier' && order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
  const reviews = db.prepare(`
    SELECT rv.*, u.name as reviewer_name
    FROM reviews rv
    LEFT JOIN users u ON rv.reviewer_id = u.id
    WHERE rv.order_id = ?
  `).all(req.params.id);

  res.json({ order, tracking, reviews });
});

router.put('/:id/accept', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'dispatched') {
    return res.status(400).json({ error: 'Order is not in dispatched status' });
  }
  if (order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Not assigned to you' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET status = 'accepted', accepted_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, req.params.id);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_accepted', '骑手已接单', ?, ?, 0, ?)
  `).run(uuidv4(), order.requester_id, `骑手已接受您的订单 ${order.order_no}`, req.params.id, now);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

router.put('/:id/arrive', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'accepted') {
    return res.status(400).json({ error: 'Order is not in accepted status' });
  }
  if (order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your order' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET status = 'arrived', arrived_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

router.put('/:id/start', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'arrived') {
    return res.status(400).json({ error: 'Order is not in arrived status' });
  }
  if (order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your order' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET status = 'in_progress', started_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

router.put('/:id/complete', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: 'Order is not in in_progress status' });
  }
  if (order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your order' });
  }

  const { photo_url } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE orders SET status = 'completed', completed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, req.params.id);

  const courier = db.prepare('SELECT * FROM courier_profiles WHERE user_id = ?').get(req.user.id);
  const newTotal = courier.total_orders + 1;
  const newCompleted = courier.completed_orders + 1;
  const newFulfillment = newTotal > 0 ? newCompleted / newTotal : 1.0;

  db.prepare(`
    UPDATE courier_profiles
    SET total_orders = ?, completed_orders = ?, fulfillment_rate = ?, current_order_id = NULL, updated_at = ?
    WHERE user_id = ?
  `).run(newTotal, newCompleted, newFulfillment, now, req.user.id);

  db.prepare(`
    UPDATE users SET credit_score = MIN(200, credit_score + 2), updated_at = ?
    WHERE id = ?
  `).run(now, req.user.id);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_completed', '订单已完成', ?, ?, 0, ?)
  `).run(uuidv4(), order.requester_id, `您的订单 ${order.order_no} 已完成`, req.params.id, now);

  if (photo_url) {
    db.prepare(`
      INSERT INTO order_tracking (id, order_id, courier_id, action, photo_url, note, created_at)
      VALUES (?, ?, ?, 'completion_photo', ?, '完成拍照', ?)
    `).run(uuidv4(), req.params.id, req.user.id, photo_url, now);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

router.put('/:id/cancel', verifyToken, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot cancel this order' });
  }

  const isRequester = req.user.role === 'requester' && order.requester_id === req.user.id;
  const isCourier = req.user.role === 'courier' && order.courier_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isRequester && !isCourier && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to cancel' });
  }

  const { cancel_reason } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE orders SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(now, cancel_reason || 'No reason provided', now, req.params.id);

  if (order.courier_id) {
    db.prepare(`
      UPDATE courier_profiles SET current_order_id = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(now, order.courier_id);

    db.prepare(`
      UPDATE users SET credit_score = MAX(0, credit_score - 5), updated_at = ?
      WHERE id = ?
    `).run(now, isCourier ? req.user.id : order.courier_id);
  }

  if (isRequester) {
    db.prepare(`
      UPDATE users SET credit_score = MAX(0, credit_score - 5), updated_at = ?
      WHERE id = ?
    `).run(now, req.user.id);
  }

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_cancelled', '订单已取消', ?, ?, 0, ?)
  `).run(uuidv4(), order.requester_id, `订单 ${order.order_no} 已取消`, req.params.id, now);

  if (order.courier_id && order.courier_id !== req.user.id) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
      VALUES (?, ?, 'order_cancelled', '订单已取消', ?, ?, 0, ?)
    `).run(uuidv4(), order.courier_id, `订单 ${order.order_no} 已被取消`, req.params.id, now);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
});

router.post('/:id/tracking', verifyToken, requireRole('courier'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.courier_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your order' });
  }

  const { action, latitude, longitude, photo_url, note } = req.body;
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO order_tracking (id, order_id, courier_id, action, latitude, longitude, photo_url, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user.id, action || 'update', latitude, longitude, photo_url, note, now);

  res.status(201).json({ tracking: { id, order_id: req.params.id, courier_id: req.user.id, action, latitude, longitude, photo_url, note, created_at: now } });
});

router.post('/:id/review', verifyToken, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'completed') {
    return res.status(400).json({ error: 'Can only review completed orders' });
  }

  const { rating, comment, to_user_id } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  if (!to_user_id) {
    return res.status(400).json({ error: 'to_user_id is required' });
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND from_user_id = ? AND to_user_id = ?').get(req.params.id, req.user.id, to_user_id);
  if (existing) {
    return res.status(400).json({ error: 'Already reviewed' });
  }

  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO reviews (id, order_id, from_user_id, to_user_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user.id, to_user_id, rating, comment, now);

  if (rating >= 4) {
    db.prepare('UPDATE users SET credit_score = MIN(200, credit_score + 1), updated_at = ? WHERE id = ?').run(now, to_user_id);
  } else if (rating <= 2) {
    db.prepare('UPDATE users SET credit_score = MAX(0, credit_score - 3), updated_at = ? WHERE id = ?').run(now, to_user_id);
  }

  const targetCourier = db.prepare('SELECT * FROM courier_profiles WHERE user_id = ?').get(to_user_id);
  if (targetCourier) {
    const reviews = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE to_user_id = ?').get(to_user_id);
    const newAvg = reviews.avg || 5.0;
    db.prepare('UPDATE courier_profiles SET avg_rating = ?, updated_at = ? WHERE user_id = ?').run(newAvg, now, to_user_id);
  }

  res.status(201).json({ review: { id, order_id: req.params.id, from_user_id: req.user.id, to_user_id, rating, comment, created_at: now } });
});

module.exports = router;
