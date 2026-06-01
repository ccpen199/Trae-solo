import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/dish/:dishId', (req, res) => {
  db.all('SELECT * FROM store_feedback WHERE dish_id = ? ORDER BY feedback_date DESC', [req.params.dishId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { dish_id, store_id, sales_volume, customer_feedback, issues, feedback_date } = req.body;
  const stmt = db.prepare(`
    INSERT INTO store_feedback (dish_id, store_id, sales_volume, customer_feedback, issues, feedback_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(dish_id, store_id, sales_volume, customer_feedback, issues, feedback_date || new Date().toISOString().split('T')[0], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, dish_id });
  });
  stmt.finalize();
});

export default router;
