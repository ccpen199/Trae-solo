import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY id').all();
  res.json(stores);
});

router.get('/:id', (req, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
  if (!store) return res.status(404).json({ error: '门店不存在' });
  res.json(store);
});

router.post('/', (req, res) => {
  const { name, address, phone, capacity, opening_time, closing_time } = req.body;
  const result = db.prepare(
    'INSERT INTO stores (name, address, phone, capacity, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, address, phone, capacity || 10, opening_time || '09:00', closing_time || '21:00');
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', (req, res) => {
  const { name, address, phone, capacity, opening_time, closing_time } = req.body;
  db.prepare(
    'UPDATE stores SET name = ?, address = ?, phone = ?, capacity = ?, opening_time = ?, closing_time = ? WHERE id = ?'
  ).run(name, address, phone, capacity, opening_time, closing_time, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM stores WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
