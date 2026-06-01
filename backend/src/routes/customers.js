const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json(customers);
});

router.post('/', (req, res) => {
  const { name, contact, phone, address } = req.body;
  const result = db.prepare(
    'INSERT INTO customers (name, contact, phone, address) VALUES (?, ?, ?, ?)'
  ).run(name, contact, phone, address);
  res.json({ id: result.lastInsertRowid, name, contact, phone, address });
});

router.put('/:id', (req, res) => {
  const { name, contact, phone, address } = req.body;
  db.prepare(
    'UPDATE customers SET name = ?, contact = ?, phone = ?, address = ? WHERE id = ?'
  ).run(name, contact, phone, address, req.params.id);
  res.json({ id: req.params.id, name, contact, phone, address });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
