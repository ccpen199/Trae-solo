const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
  res.json(suppliers);
});

router.post('/', (req, res) => {
  const { name, contact, phone, email } = req.body;
  const result = db.prepare(
    'INSERT INTO suppliers (name, contact, phone, email) VALUES (?, ?, ?, ?)'
  ).run(name, contact, phone, email);
  res.json({ id: result.lastInsertRowid, name, contact, phone, email });
});

router.get('/:id/factories', (req, res) => {
  const factories = db.prepare(
    'SELECT * FROM factories WHERE supplier_id = ?'
  ).all(req.params.id);
  res.json(factories);
});

module.exports = router;
