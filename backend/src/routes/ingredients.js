import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM ingredients ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { name, unit, price_per_unit, loss_rate, calories_per_unit, protein_per_unit, fat_per_unit, carbs_per_unit } = req.body;
  const stmt = db.prepare(`
    INSERT INTO ingredients (name, unit, price_per_unit, loss_rate, calories_per_unit, protein_per_unit, fat_per_unit, carbs_per_unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, unit, price_per_unit, loss_rate || 0, calories_per_unit || 0, protein_per_unit || 0, fat_per_unit || 0, carbs_per_unit || 0, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name });
  });
  stmt.finalize();
});

router.put('/:id', (req, res) => {
  const { name, unit, price_per_unit, loss_rate, calories_per_unit, protein_per_unit, fat_per_unit, carbs_per_unit } = req.body;
  const stmt = db.prepare(`
    UPDATE ingredients SET name = ?, unit = ?, price_per_unit = ?, loss_rate = ?, calories_per_unit = ?, protein_per_unit = ?, fat_per_unit = ?, carbs_per_unit = ?
    WHERE id = ?
  `);
  stmt.run(name, unit, price_per_unit, loss_rate, calories_per_unit, protein_per_unit, fat_per_unit, carbs_per_unit, req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM ingredients WHERE id = ?');
  stmt.run(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

export default router;
