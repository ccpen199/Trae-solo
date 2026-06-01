const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { phone } = req.query;
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (phone) {
    sql += ' AND phone LIKE ?';
    params.push(`%${phone}%`);
  }
  sql += ' ORDER BY id DESC';
  const customers = db.prepare(sql).all(...params);
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: '客户不存在' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const { name, phone, id_card, license_number } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO customers (name, phone, id_card, license_number) VALUES (?, ?, ?, ?)'
    ).run(name, phone, id_card, license_number);
    res.json({ id: result.lastInsertRowid, name, phone, id_card, license_number });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, id_card, license_number } = req.body;
  db.prepare(
    'UPDATE customers SET name = ?, phone = ?, id_card = ?, license_number = ? WHERE id = ?'
  ).run(name, phone, id_card, license_number, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
