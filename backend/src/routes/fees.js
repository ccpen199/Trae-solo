const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const fees = db.prepare(`
    SELECT f.*, o.order_no, c.name as customer_name
    FROM fees f
    LEFT JOIN orders o ON f.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY f.created_at DESC
  `).all();
  res.json(fees);
});

router.post('/', (req, res) => {
  const { order_id, fee_type, amount, description } = req.body;
  const validTypes = ['waiting', 'address_change', 'overnight', 'empty_drive'];
  if (!validTypes.includes(fee_type)) {
    return res.status(400).json({ error: '无效的费用类型' });
  }
  const typeNames = {
    waiting: '等待费',
    address_change: '改地址费',
    overnight: '压夜费',
    empty_drive: '空驶费'
  };
  const result = db.prepare(
    'INSERT INTO fees (order_id, fee_type, amount, description) VALUES (?, ?, ?, ?)'
  ).run(order_id, typeNames[fee_type], amount, description);
  res.json({ id: result.lastInsertRowid, order_id, fee_type: typeNames[fee_type], amount, description, status: 'pending' });
});

router.put('/:id/customer-approve', (req, res) => {
  db.prepare('UPDATE fees SET status = ? WHERE id = ?').run('customer_approved', req.params.id);
  res.json({ success: true });
});

router.put('/:id/finance-approve', (req, res) => {
  db.prepare('UPDATE fees SET status = ? WHERE id = ?').run('finance_approved', req.params.id);
  res.json({ success: true });
});

router.put('/:id/reject', (req, res) => {
  db.prepare('UPDATE fees SET status = ? WHERE id = ?').run('rejected', req.params.id);
  res.json({ success: true });
});

module.exports = router;
