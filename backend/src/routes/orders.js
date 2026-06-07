import express from 'express';
import db from '../db/index.js';
import { authenticate, requireRole } from '../middleware/oauth.js';
import { maskPhone } from '../utils/encryption.js';
import { dispatchOrder } from '../services/dispatchEngine.js';
import { calculateRiderFee } from '../services/commissionEngine.js';

const router = express.Router();

const logEvent = (orderId, eventType, eventData, operatorId) => {
  db.prepare(`INSERT INTO order_events (order_id, event_type, event_data, operator_id) VALUES (?, ?, ?, ?)`).run(
    orderId, eventType, eventData ? JSON.stringify(eventData) : null, operatorId
  );
};

router.get('/', authenticate, (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;

  let sql = `SELECT * FROM orders`;
  const params = [];

  if (req.user.role === 'rider') {
    sql += ` WHERE rider_id = ?`;
    params.push(req.user.id);
  }

  if (status) {
    sql += params.length > 0 ? ` AND status = ?` : ` WHERE status = ?`;
    params.push(status.toLowerCase());
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const orders = db.prepare(sql).all(...params);
  const result = orders.map(o => ({
    ...o,
    customer_phone: maskPhone(o.customer_phone)
  }));

  res.json(result);
});

router.get('/available', authenticate, requireRole('rider'), (req, res) => {
  const { status = 'pending', limit = 20, offset = 0 } = req.query;

  const verification = db.prepare(`SELECT verification_status FROM rider_verifications WHERE user_id = ?`).get(req.user.id);
  const vehicle = db.prepare(`SELECT binding_status FROM rider_vehicles WHERE user_id = ?`).get(req.user.id);

  if (!verification || verification.verification_status !== 'verified') {
    return res.status(400).json({ error: 'Identity not verified' });
  }
  if (!vehicle || vehicle.binding_status !== 'bound') {
    return res.status(400).json({ error: 'Vehicle not bound' });
  }

  let orders;
  if (status === 'pending') {
    orders = db.prepare(`
      SELECT o.* FROM orders o
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  } else {
    orders = db.prepare(`
      SELECT o.* FROM orders o
      WHERE o.rider_id = ? AND o.status = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, status, limit, offset);
  }

  const result = orders.map(o => ({
    ...o,
    customer_phone: maskPhone(o.customer_phone)
  }));

  res.json(result);
});

router.get('/my', authenticate, requireRole('rider'), (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;

  let sql = `SELECT * FROM orders WHERE rider_id = ?`;
  const params = [req.user.id];

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const orders = db.prepare(sql).all(...params);
  const result = orders.map(o => ({
    ...o,
    customer_phone: maskPhone(o.customer_phone)
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const events = db.prepare(`SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC`).all(id);
  const exceptions = db.prepare(`SELECT * FROM order_exceptions WHERE order_id = ?`).all(id);
  const signature = db.prepare(`SELECT * FROM order_signatures WHERE order_id = ?`).get(id);

  res.json({
    order: {
      ...order,
      customer_phone: maskPhone(order.customer_phone)
    },
    events,
    exceptions,
    signature
  });
});

router.post('/:id/dispatch', authenticate, requireRole('admin'), (req, res) => {
  const result = dispatchOrder(parseInt(req.params.id));
  res.json(result);
});

router.post('/:id/accept', authenticate, requireRole('rider'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const now = Math.floor(Date.now() / 1000);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Order not available' });

  const feeCalculation = calculateRiderFee(order, req.user.id);
  const riderFee = typeof feeCalculation === 'object' ? feeCalculation.riderFee : feeCalculation;
  const feeBreakdown = typeof feeCalculation === 'object' ? feeCalculation.breakdown : null;

  db.prepare(`UPDATE orders SET rider_id = ?, status = 'accepted', accepted_at = ?, rider_fee = ?, updated_at = ? WHERE id = ?`).run(
    req.user.id, now, riderFee, now, orderId
  );

  db.prepare(`UPDATE dispatch_records SET accepted = 1 WHERE order_id = ? AND rider_id = ?`).run(orderId, req.user.id);
  logEvent(orderId, 'accepted', { riderFee, feeBreakdown }, req.user.id);

  db.prepare(`INSERT INTO system_logs (user_id, action, target_type, target_id, request_id) VALUES (?, 'accept_order', 'order', ?, ?)`).run(
    req.user.id, orderId, req.requestId
  );

  res.json({ success: true, riderFee, feeBreakdown });
});

router.post('/:id/pick', authenticate, requireRole('rider'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const now = Math.floor(Date.now() / 1000);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (order.status !== 'accepted') return res.status(400).json({ error: 'Order not accepted' });

  db.prepare(`UPDATE orders SET status = 'picked', picked_at = ?, updated_at = ? WHERE id = ?`).run(now, now, orderId);
  logEvent(orderId, 'picked', null, req.user.id);

  res.json({ success: true });
});

router.post('/:id/deliver', authenticate, requireRole('rider'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const { signer_name, signature_data, signer_photo, proof_url, recipient_sign } = req.body;
  const now = Math.floor(Date.now() / 1000);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (order.status !== 'picked') return res.status(400).json({ error: 'Order not picked' });

  const final_signer_name = signer_name || recipient_sign || '';
  const final_signature_data = signature_data || proof_url || '';

  db.prepare(`UPDATE orders SET status = 'delivered', delivered_at = ?, settlement_status = 'settling', updated_at = ? WHERE id = ?`).run(now, now, orderId);
  logEvent(orderId, 'delivered', null, req.user.id);

  if (final_signature_data || final_signer_name) {
    db.prepare(`INSERT INTO order_signatures (order_id, signer_name, signature_data, signer_photo, signed_at) VALUES (?, ?, ?, ?, ?)`).run(
      orderId, final_signer_name, final_signature_data, signer_photo || '', now
    );
  }

  const settleTx = db.transaction(() => {
    db.prepare(`UPDATE orders SET settlement_status = 'settled', settlement_time = ? WHERE id = ?`).run(now, orderId);

    const wallet = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(order.rider_id);
    const newBalance = Math.round((wallet.balance + order.rider_fee) * 100) / 100;

    db.prepare(`UPDATE wallets SET balance = ?, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance, order.rider_fee, now, order.rider_id
    );

    db.prepare(`INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, description) VALUES (?, ?, 'income', ?, ?, '订单收入')`).run(
      order.rider_id, orderId, order.rider_fee, newBalance
    );

    db.prepare(`UPDATE rider_stats SET completed_orders = completed_orders + 1, total_orders = total_orders + 1, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
      order.rider_fee, now, order.rider_id
    );
  });

  settleTx();
  logEvent(orderId, 'settled', { amount: order.rider_fee }, req.user.id);

  res.json({ success: true, settledAmount: order.rider_fee, settlementTime: now });
});

router.post('/:id/settle', authenticate, requireRole('rider', 'admin'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const now = Math.floor(Date.now() / 1000);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.rider_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (order.settlement_status !== 'settling') return res.status(400).json({ error: 'Order not in settling state' });

  const settleTx = db.transaction(() => {
    db.prepare(`UPDATE orders SET settlement_status = 'settled', settlement_time = ? WHERE id = ?`).run(now, orderId);

    const wallet = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(order.rider_id);
    const newBalance = Math.round((wallet.balance + order.rider_fee) * 100) / 100;

    db.prepare(`UPDATE wallets SET balance = ?, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
      newBalance, order.rider_fee, now, order.rider_id
    );

    db.prepare(`INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, description) VALUES (?, ?, 'income', ?, ?, '订单收入')`).run(
      order.rider_id, orderId, order.rider_fee, newBalance
    );

    db.prepare(`UPDATE rider_stats SET completed_orders = completed_orders + 1, total_orders = total_orders + 1, total_income = total_income + ?, updated_at = ? WHERE user_id = ?`).run(
      order.rider_fee, now, order.rider_id
    );
  });

  settleTx();
  logEvent(orderId, 'settled', { amount: order.rider_fee }, req.user.id);

  res.json({ success: true, settledAmount: order.rider_fee, settlementTime: now });
});

router.post('/:id/exception', authenticate, (req, res) => {
  const orderId = parseInt(req.params.id);
  const { exception_type, description, photo_url } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (!exception_type) return res.status(400).json({ error: 'Exception type required' });

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare(`INSERT INTO order_exceptions (order_id, exception_type, description, photo_url, reported_by) VALUES (?, ?, ?, ?, ?)`).run(
    orderId, exception_type, description || '', photo_url || '', req.user.id
  );

  if (order.status !== 'delivered' && order.status !== 'settled') {
    db.prepare(`UPDATE orders SET status = 'exception', updated_at = ? WHERE id = ?`).run(now, orderId);
  }

  logEvent(orderId, 'exception_reported', { type: exception_type, description }, req.user.id);

  res.json({ success: true, exceptionId: db.prepare(`SELECT last_insert_rowid() as id`).get().id });
});

router.get('/:id/exceptions', authenticate, (req, res) => {
  const orderId = parseInt(req.params.id);
  const exceptions = db.prepare(`SELECT * FROM order_exceptions WHERE order_id = ? ORDER BY created_at DESC`).all(orderId);
  res.json(exceptions);
});

router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const {
    merchant_name, merchant_address, merchant_lat, merchant_lng,
    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
    goods_description, estimated_distance, estimated_duration, base_fee, tip_fee,
    pickup_address, pickup_lat, pickup_lng,
    delivery_address, delivery_lat, delivery_lng,
    goods_desc, amount, delivery_fee
  } = req.body;

  const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const now = Math.floor(Date.now() / 1000);

  const final_merchant_name = merchant_name || '';
  const final_merchant_address = merchant_address || pickup_address || '';
  const final_merchant_lat = merchant_lat || pickup_lat || 0;
  const final_merchant_lng = merchant_lng || pickup_lng || 0;
  const final_customer_address = customer_address || delivery_address || '';
  const final_customer_lat = customer_lat || delivery_lat || 0;
  const final_customer_lng = customer_lng || delivery_lng || 0;
  const final_goods_description = goods_description || goods_desc || '';
  const final_base_fee = base_fee || delivery_fee || 0;
  const final_total_fee = Math.round(((final_base_fee || 0) + (tip_fee || 0)) * 100) / 100;

  const id = db.prepare(`INSERT INTO orders (order_no, merchant_name, merchant_address, merchant_lat, merchant_lng, customer_name, customer_phone, customer_address, customer_lat, customer_lng, goods_description, estimated_distance, estimated_duration, base_fee, tip_fee, total_fee, expected_pickup_time, expected_delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    orderNo, final_merchant_name, final_merchant_address, final_merchant_lat, final_merchant_lng,
    customer_name, customer_phone, final_customer_address, final_customer_lat, final_customer_lng,
    final_goods_description, estimated_distance || 0, estimated_duration || 0,
    final_base_fee, tip_fee || 0, final_total_fee,
    now + 900, now + 2400
  ).lastInsertRowid;

  res.json({ success: true, data: { id, orderNo, orderId: id }, orderId: id, orderNo });
});

router.post('/:id/pickup', authenticate, requireRole('rider'), (req, res) => {
  req.url = `/${req.params.id}/pick`;
  router.handle(req, res, () => {});
});

router.post('/:id/settle-auto', authenticate, requireRole('rider'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'delivered' && order.settlement_status === 'settling') {
    req.url = `/${orderId}/settle`;
    router.handle(req, res, () => {});
  } else {
    res.json({ success: true, message: 'No settlement needed' });
  }
});

export default router;
