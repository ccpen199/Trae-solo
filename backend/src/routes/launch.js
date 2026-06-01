import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM launch_plans ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.get('/dish/:dishId', (req, res) => {
  db.all('SELECT * FROM launch_plans WHERE dish_id = ? ORDER BY created_at DESC', [req.params.dishId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { dish_id, store_scope, training_materials, material_prep, launch_date, status } = req.body;
  const stmt = db.prepare(`
    INSERT INTO launch_plans (dish_id, store_scope, training_materials, material_prep, launch_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(dish_id, store_scope, training_materials, material_prep, launch_date, status || 'planning', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, dish_id });
  });
  stmt.finalize();
});

router.put('/:id', (req, res) => {
  const { store_scope, training_materials, material_prep, launch_date, status } = req.body;
  const stmt = db.prepare(`
    UPDATE launch_plans SET store_scope = ?, training_materials = ?, material_prep = ?, launch_date = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(store_scope, training_materials, material_prep, launch_date, status, req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM launch_plans WHERE id = ?');
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
