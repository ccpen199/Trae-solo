const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/riders', (req, res) => {
  const riders = db.prepare('SELECT * FROM riders ORDER BY name').all();
  res.json(riders);
});

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT d.*, o.order_no, o.customer_name, o.address, o.customer_phone,
           r.name as rider_name, r.phone as rider_phone
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    LEFT JOIN riders r ON d.rider_id = r.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY d.created_at DESC';
  const deliveries = db.prepare(query).all(...params);
  res.json(deliveries);
});

router.post('/assign', (req, res) => {
  const { order_ids, rider_id } = req.body;
  
  const createDelivery = db.prepare(`
    INSERT INTO deliveries (order_id, rider_id, status)
    VALUES (?, ?, 'assigned')
  `);
  
  for (const orderId of order_ids) {
    createDelivery.run(orderId, rider_id);
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('delivering', orderId);
  }
  
  res.json({ success: true });
});

router.post('/:id/accept', (req, res) => {
  db.prepare(`
    UPDATE deliveries 
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const delivery = db.prepare('SELECT order_id FROM deliveries WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('out_for_delivery', delivery.order_id);
  
  res.json({ success: true });
});

router.post('/:id/arrive', (req, res) => {
  db.prepare(`
    UPDATE deliveries 
    SET status = 'arrived', arrived_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true });
});

router.post('/:id/sign', (req, res) => {
  db.prepare(`
    UPDATE deliveries 
    SET status = 'signed', signed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const delivery = db.prepare('SELECT order_id FROM deliveries WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', delivery.order_id);
  
  res.json({ success: true });
});

router.post('/:id/fail', (req, res) => {
  const { failure_reason } = req.body;
  
  db.prepare(`
    UPDATE deliveries 
    SET status = 'failed', failed_at = CURRENT_TIMESTAMP, failure_reason = ?
    WHERE id = ?
  `).run(failure_reason, req.params.id);
  
  const delivery = db.prepare('SELECT order_id FROM deliveries WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('delivery_failed', delivery.order_id);
  
  res.json({ success: true });
});

module.exports = router;
