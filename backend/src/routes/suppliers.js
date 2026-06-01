import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
  res.json(suppliers);
});

router.post('/', (req, res) => {
  const { name, contact, phone, address } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO suppliers (name, contact, phone, address) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, contact, phone, address);
    res.json({ id: result.lastInsertRowid, name, contact, phone, address });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, contact, phone, address } = req.body;
  const stmt = db.prepare('UPDATE suppliers SET name=?, contact=?, phone=?, address=? WHERE id=?');
  const result = stmt.run(name, contact, phone, address, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  res.json({ id: req.params.id, name, contact, phone, address });
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM suppliers WHERE id=?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  res.json({ message: 'Supplier deleted' });
});

export default router;
