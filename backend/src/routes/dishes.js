import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM dishes ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM dishes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Dish not found' });
      return;
    }
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const { name, target_audience, flavor_direction, price_range_min, price_range_max, rnd_owner, expected_margin } = req.body;
  
  db.get('SELECT id FROM dishes WHERE name = ?', [name], (err, row) => {
    if (row) {
      res.status(400).json({ error: '该菜品已存在，请勿重复立项', duplicate: true });
      return;
    }
    
    const stmt = db.prepare(`
      INSERT INTO dishes (name, target_audience, flavor_direction, price_range_min, price_range_max, rnd_owner, expected_margin, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `);
    stmt.run(name, target_audience, flavor_direction, price_range_min, price_range_max, rnd_owner, expected_margin, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, status: 'draft' });
    });
    stmt.finalize();
  });
});

router.put('/:id', (req, res) => {
  const { name, target_audience, flavor_direction, price_range_min, price_range_max, rnd_owner, expected_margin, status } = req.body;
  const id = req.params.id;
  
  db.get('SELECT id FROM dishes WHERE name = ? AND id != ?', [name, id], (err, row) => {
    if (row) {
      res.status(400).json({ error: '该菜品名称已存在', duplicate: true });
      return;
    }
    
    const stmt = db.prepare(`
      UPDATE dishes 
      SET name = ?, target_audience = ?, flavor_direction = ?, price_range_min = ?, price_range_max = ?, rnd_owner = ?, expected_margin = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, target_audience, flavor_direction, price_range_min, price_range_max, rnd_owner, expected_margin, status, id, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, changes: this.changes });
    });
    stmt.finalize();
  });
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM dishes WHERE id = ?');
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
