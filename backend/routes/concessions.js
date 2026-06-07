import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { category, status } = req.query;
    let sql = 'SELECT * FROM concessions WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY id';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/combos', (req, res) => {
  try {
    const combos = db.prepare('SELECT * FROM concession_combos ORDER BY id').all();
    res.json(combos.map(c => ({ ...c, items: JSON.parse(c.items) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/combos', (req, res) => {
  try {
    const { name, description, items, total_price, discount_rate, status } = req.body;
    if (!name || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'name and items array are required' });
    }
    const result = db.prepare(
      'INSERT INTO concession_combos (name, description, items, total_price, discount_rate, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description || null, JSON.stringify(items), total_price, discount_rate || 1.0, status || 'available');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM concessions WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Concession not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, category, price, image_url, status } = req.body;
    const result = db.prepare(
      'INSERT INTO concessions (name, category, price, image_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(name, category, price, image_url || null, status || 'available');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM concessions WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Concession not found' });
    const { name, category, price, image_url, status } = req.body;
    db.prepare('UPDATE concessions SET name=?, category=?, price=?, image_url=?, status=? WHERE id=?')
      .run(name ?? existing.name, category ?? existing.category, price ?? existing.price, image_url ?? existing.image_url, status ?? existing.status, req.params.id);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM concessions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Concession not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
