const express = require('express');
const { getDB } = require('../db/init');
const { verifyToken, requireRole } = require('../middleware/auth');
const { autoDispatch, reassignOrder, checkTimeouts, haversineDistance, scoreCourier } = require('../services/dispatch');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const typeMap = {
  pickup_delivery: '帮取送', purchase: '帮买', allpurpose: '全能帮', queue: '帮排队'
};

router.get('/candidates/:orderId', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const orderLat = order.pickup_latitude;
  const orderLng = order.pickup_longitude;

  const couriers = db.prepare(`
    SELECT cp.*, u.name, u.phone, u.credit_score,
           (SELECT COUNT(*) FROM orders o WHERE o.courier_id = cp.user_id AND o.status = 'completed') as completed_orders,
           (SELECT COUNT(*) FROM orders o WHERE o.courier_id = cp.user_id AND o.status IN ('accepted', 'arrived', 'in_progress')) as current_orders
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.status = 'approved'
  `).all();

  const candidates = couriers.map(c => {
    const distance = orderLat && orderLng && c.latitude && c.longitude
      ? haversineDistance(orderLat, orderLng, c.latitude, c.longitude)
      : null;

    const isAvailable = c.is_online === 1 && !c.current_order_id;
    const avgRating = c.avg_rating || c.rating || 0;
    const fulfillmentRate = typeof c.fulfillment_rate === 'number' && c.fulfillment_rate > 1
      ? c.fulfillment_rate
      : Math.round((c.fulfillment_rate || 0) * 100);

    const scoreResult = orderLat && orderLng && c.latitude && c.longitude
      ? scoreCourier(c, orderLat, orderLng)
      : null;

    return {
      id: c.user_id,
      name: c.name,
      phone: c.phone,
      distance: distance != null ? Math.round(distance * 1000) : null,
      distance_km: distance != null ? distance.toFixed(2) : null,
      rating: avgRating,
      fulfillment_rate: fulfillmentRate,
      completed_orders: c.completed_orders || 0,
      is_online: c.is_online === 1,
      is_available: isAvailable,
      current_orders: c.current_orders || 0,
      credit_score: c.credit_score,
      service_area: c.service_area,
      score: scoreResult?.total || 0,
      score_details: scoreResult?.details || null,
    };
  }).filter(c => c.distance == null || c.distance_km <= 10)
    .sort((a, b) => b.score - a.score);

  res.json({
    order_id: order.id,
    order_no: order.order_no,
    pickup_address: order.pickup_address,
    candidates,
  });
});

router.post('/manual', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const { order_id, courier_id, note } = req.body;

  if (!order_id || !courier_id) {
    return res.status(400).json({ error: 'order_id and courier_id required' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!['pending', 'dispatched', 'timeout'].includes(order.status)) {
    return res.status(400).json({ error: 'Order cannot be dispatched in current status' });
  }

  const courier = db.prepare(`
    SELECT cp.*, u.name
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ? AND cp.status = 'approved'
  `).get(courier_id);
  if (!courier) {
    return res.status(404).json({ error: 'Courier not found or not approved' });
  }

  const now = new Date().toISOString();
  const previousCourierId = order.courier_id;

  db.prepare(`
    UPDATE orders SET courier_id = ?, status = 'dispatched', assigned_at = ?, updated_at = ?, dispatcher_note = ?
    WHERE id = ?
  `).run(courier_id, now, now, note || null, order_id);

  if (previousCourierId && previousCourierId !== courier_id) {
    db.prepare(`
      UPDATE courier_profiles SET current_order_id = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(now, previousCourierId);

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
      VALUES (?, ?, 'order_cancelled', '订单已转派', ?, ?, 0, ?)
    `).run(uuidv4(), previousCourierId, `订单 ${order.order_no} 已转派给其他骑手`, order_id, now);
  }

  db.prepare(`
    UPDATE courier_profiles SET current_order_id = ?, updated_at = ?
    WHERE user_id = ?
  `).run(order_id, now, courier_id);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_dispatched', '新订单派单', ?, ?, 0, ?)
  `).run(uuidv4(), courier_id, `您有新的派单：${order.title}`, order_id, now);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_dispatched', '骑手已派单', ?, ?, 0, ?)
  `).run(uuidv4(), order.requester_id, `您的订单 ${order.order_no} 已分配给骑手 ${courier.name}`, order_id, now);

  db.prepare(`
    INSERT INTO order_tracking (id, order_id, status, note, created_at)
    VALUES (?, ?, 'dispatched', ?, ?)
  `).run(uuidv4(), order_id, note ? `手动调度：${note}` : '手动调度分配', now);

  const updated = db.prepare(`
    SELECT o.*, u.name as courier_name
    FROM orders o
    LEFT JOIN users u ON o.courier_id = u.id
    WHERE o.id = ?
  `).get(order_id);

  res.json({ success: true, order: updated, message: `已分配给 ${courier.name}` });
});

router.post('/auto/:orderId', verifyToken, requireRole('admin'), (req, res) => {
  const result = autoDispatch(req.params.orderId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post('/reassign/:orderId', verifyToken, requireRole('admin'), (req, res) => {
  const result = reassignOrder(req.params.orderId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

router.get('/status', verifyToken, requireRole('admin'), (req, res) => {
  const db = getDB();
  const timeoutResults = checkTimeouts();
  const pending = db.prepare(`
    SELECT o.*, u.name as courier_name
    FROM orders o
    LEFT JOIN users u ON o.courier_id = u.id
    WHERE o.status IN ('pending', 'dispatched', 'timeout')
    ORDER BY o.created_at DESC
  `).all();
  const timeoutOrders = pending.filter(o => o.status === 'timeout').map(o => ({
    id: o.id,
    order_no: o.order_no,
    title: o.title,
    type: o.type,
    status: o.status,
    timeout_minutes: o.deadline ? Math.round((Date.now() - new Date(o.deadline).getTime()) / 60000) : 0,
    courier: o.courier_name || '未分配',
  }));
  const queue = pending.filter(o => o.status !== 'timeout').map(o => ({
    id: o.id,
    order_no: o.order_no,
    title: o.title,
    type: o.type,
    status: o.status,
    priority: o.priority,
    fee: o.fee,
  }));
  
  const districtHeat = db.prepare(`
    SELECT district, center_latitude, center_longitude, heat_level, active_couriers, pending_orders
    FROM service_areas
    ORDER BY pending_orders DESC
  `).all();

  res.json({
    engine: 'running',
    last_timeout_check: new Date().toISOString(),
    timeouts_processed: timeoutResults.length,
    queue: queue,
    timeout_alerts: timeoutOrders,
    pending_count: queue.length,
    timeout_count: timeoutOrders.length,
    district_heat: districtHeat,
  });
});

module.exports = router;
