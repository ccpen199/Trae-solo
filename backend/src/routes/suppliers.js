const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM suppliers WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  const suppliers = db.prepare(sql).all(...params);
  res.json(suppliers);
});

router.get('/:id', (req, res) => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!supplier) {
    return res.status(404).json({ error: '供应商不存在' });
  }
  res.json(supplier);
});

router.post('/', (req, res) => {
  const { code, name, contact, phone, address } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO suppliers (code, name, contact, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(code, name, contact, phone, address);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, contact, phone, address, status } = req.body;
  db.prepare(`
    UPDATE suppliers SET name = ?, contact = ?, phone = ?, address = ?, status = ?
    WHERE id = ?
  `).run(name, contact, phone, address, status, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

module.exports = router;
