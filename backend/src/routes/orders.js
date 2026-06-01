const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const items = db.prepare(`
    SELECT oi.*, s.sku_code, s.name, s.is_weighed, s.unit, sub.name as substitution_name
    FROM order_items oi
    JOIN skus s ON oi.sku_id = s.id
    LEFT JOIN skus sub ON oi.substitution_sku_id = sub.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  
  const pickTask = db.prepare(`
    SELECT pt.*, p.name as picker_name
    FROM pick_tasks pt
    LEFT JOIN pickers p ON pt.picker_id = p.id
    WHERE pt.order_id = ?
  `).get(req.params.id);
  
  const delivery = db.prepare(`
    SELECT d.*, r.name as rider_name, r.phone as rider_phone
    FROM deliveries d
    LEFT JOIN riders r ON d.rider_id = r.id
    WHERE d.order_id = ?
  `).get(req.params.id);
  
  const afterSales = db.prepare('SELECT * FROM after_sales WHERE order_id = ?').all(req.params.id);
  
  res.json({ order, items, pickTask, delivery, afterSales });
});

router.post('/', (req, res) => {
  const { customer_name, customer_phone, address, temperature_zone, time_slot, route, priority, items } = req.body;
  
  const orderNo = 'ORD' + Date.now();
  let totalAmount = 0;
  
  for (const item of items) {
    const sku = db.prepare('SELECT price FROM skus WHERE id = ?').get(item.sku_id);
    if (sku) {
      totalAmount += sku.price * item.quantity;
    }
  }
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, customer_name, customer_phone, address, temperature_zone, time_slot, route, priority, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, customer_name, customer_phone, address, temperature_zone, time_slot, route, priority || 0, totalAmount);
  
  const orderId = result.lastInsertRowid;
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, sku_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const item of items) {
    const sku = db.prepare('SELECT price FROM skus WHERE id = ?').get(item.sku_id);
    insertItem.run(orderId, item.sku_id, item.quantity, sku?.price || 0);
  }
  
  res.json({ id: orderId, order_no: orderNo, success: true });
});

router.post('/:id/substitute', (req, res) => {
  const { order_item_id, substitution_sku_id, substitution_reason } = req.body;
  
  db.prepare(`
    UPDATE order_items 
    SET substitution_sku_id = ?, substitution_reason = ?, status = 'substituted'
    WHERE id = ?
  `).run(substitution_sku_id, substitution_reason, order_item_id);
  
  res.json({ success: true });
});

router.post('/:id/cancel-item', (req, res) => {
  const { order_item_id, reason } = req.body;
  
  const orderItem = db.prepare('SELECT * FROM order_items WHERE id = ?').get(order_item_id);
  
  db.prepare(`
    UPDATE order_items 
    SET status = 'cancelled'
    WHERE id = ?
  `).run(order_item_id);
  
  db.prepare(`
    UPDATE orders 
    SET total_amount = total_amount - ?
    WHERE id = ?
  `).run(orderItem.quantity * orderItem.unit_price, req.params.id);
  
  res.json({ success: true });
});

module.exports = router;
