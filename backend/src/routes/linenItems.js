import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { status, category } = req.query;
  let sql = 'SELECT * FROM linen_items WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC';
  const items = db.prepare(sql).all(...params);
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM linen_items WHERE id=?').get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Linen item not found' });
  }
  res.json(item);
});

router.post('/', (req, res) => {
  const { asset_number, category, specification, room_type, lifespan_months, status } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO linen_items (asset_number, category, specification, room_type, lifespan_months, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(asset_number, category, specification, room_type, lifespan_months, status || 'available');
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { asset_number, category, specification, room_type, lifespan_months, status, loss_reason, scrap_reason } = req.body;
  const stmt = db.prepare(`
    UPDATE linen_items 
    SET asset_number=?, category=?, specification=?, room_type=?, lifespan_months=?, status=?, 
        loss_reason=?, scrap_reason=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `);
  const result = stmt.run(asset_number, category, specification, room_type, lifespan_months, status, loss_reason, scrap_reason, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Linen item not found' });
  }
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM linen_items WHERE id=?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Linen item not found' });
  }
  res.json({ message: 'Linen item deleted' });
});

export default router;
