const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json(clients);
});

router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) {
    return res.status(404).json({ error: '客户不存在' });
  }
  res.json(client);
});

router.post('/', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: '姓名和电话为必填项' });
  }
  
  const result = db.prepare(
    'INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)'
  ).run(name, phone, email || null);
  
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.put('/:id', (req, res) => {
  const { name, phone, email } = req.body;
  db.prepare(
    'UPDATE clients SET name = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name, phone, email || null, req.params.id);
  
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(client);
});

module.exports = router;
