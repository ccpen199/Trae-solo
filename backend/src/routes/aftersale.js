const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT a.*, o.order_no, o.customer_name, o.total_amount
    FROM after_sales a
    JOIN orders o ON a.order_id = o.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY a.created_at DESC';
  const tickets = db.prepare(query).all(...params);
  res.json(tickets);
});

router.post('/', (req, res) => {
  const { order_id, type, reason, refund_amount } = req.body;
  
  const result = db.prepare(`
    INSERT INTO after_sales (order_id, type, reason, refund_amount, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(order_id, type, reason, refund_amount || 0);
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('after_sale', order_id);
  
  res.json({ id: result.lastInsertRowid, success: true });
});

router.post('/:id/handle', (req, res) => {
  const { handled_by, status, refund_amount } = req.body;
  
  db.prepare(`
    UPDATE after_sales 
    SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, refund_amount = ?
    WHERE id = ?
  `).run(status, handled_by, refund_amount || 0, req.params.id);
  
  const ticket = db.prepare('SELECT order_id FROM after_sales WHERE id = ?').get(req.params.id);
  
  if (status === 'completed') {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('closed', ticket.order_id);
  }
  
  res.json({ success: true });
});

module.exports = router;
