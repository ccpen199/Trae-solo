import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/dish/:dishId', (req, res) => {
  db.all('SELECT * FROM acceptance_records WHERE dish_id = ? ORDER BY created_at DESC', [req.params.dishId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { dish_id, recipe_version_verified, cost_stability_verified, taste_pass_rate, trial_sales_result, shelf_status, reviewer, notes } = req.body;
  const stmt = db.prepare(`
    INSERT INTO acceptance_records (dish_id, recipe_version_verified, cost_stability_verified, taste_pass_rate, trial_sales_result, shelf_status, reviewer, review_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(dish_id, recipe_version_verified ? 1 : 0, cost_stability_verified ? 1 : 0, taste_pass_rate, trial_sales_result, shelf_status, reviewer, new Date().toISOString().split('T')[0], notes, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, dish_id });
  });
  stmt.finalize();
});

export default router;
