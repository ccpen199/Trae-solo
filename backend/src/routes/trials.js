import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/dish/:dishId', (req, res) => {
  db.all('SELECT * FROM trial_versions WHERE dish_id = ? ORDER BY version DESC', [req.params.dishId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.get('/:id/cost', (req, res) => {
  const trialId = req.params.id;
  
  const sql = `
    SELECT 
      i.name, i.unit, i.price_per_unit, i.loss_rate,
      i.calories_per_unit, i.protein_per_unit, i.fat_per_unit, i.carbs_per_unit,
      ri.quantity,
      (ri.quantity / (1 - i.loss_rate)) * i.price_per_unit as item_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.trial_version_id = ?
  `;
  
  db.all(sql, [trialId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    let totalCost = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    
    rows.forEach(item => {
      totalCost += item.item_cost;
      totalCalories += item.quantity * item.calories_per_unit;
      totalProtein += item.quantity * item.protein_per_unit;
      totalFat += item.quantity * item.fat_per_unit;
      totalCarbs += item.quantity * item.carbs_per_unit;
    });
    
    const marginRedLine = totalCost * 2.5;
    const suggestedPrice = totalCost * 3;
    
    res.json({
      items: rows,
      totalCost,
      nutrition: {
        calories: totalCalories,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs
      },
      marginRedLine,
      suggestedPrice
    });
  });
});

router.post('/', (req, res) => {
  const { dish_id, version, recipe, process_steps, photos, taste_score, feedback, created_by, recipe_items } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO trial_versions (dish_id, version, recipe, process_steps, photos, taste_score, feedback, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(dish_id, version, recipe, process_steps, photos, taste_score, feedback, created_by, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const trialId = this.lastID;
    
    if (recipe_items && recipe_items.length > 0) {
      const prep = db.prepare('INSERT INTO recipe_items (trial_version_id, ingredient_id, quantity) VALUES (?, ?, ?)');
      recipe_items.forEach(item => {
        prep.run(trialId, item.ingredient_id, item.quantity);
      });
      prep.finalize();
    }
    
    res.json({ id: trialId, version, dish_id });
  });
  stmt.finalize();
});

router.post('/:id/approve', (req, res) => {
  const { approved_by } = req.body;
  const trialId = req.params.id;
  
  db.serialize(() => {
    db.run('UPDATE trial_versions SET is_official = 0 WHERE dish_id = (SELECT dish_id FROM trial_versions WHERE id = ?)', [trialId]);
    
    const stmt = db.prepare(`
      UPDATE trial_versions 
      SET is_official = 1, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(approved_by, trialId, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get('SELECT dish_id FROM trial_versions WHERE id = ?', [trialId], (err, row) => {
        if (row) {
          db.run('UPDATE dishes SET status = ? WHERE id = ?', ['approved', row.dish_id]);
        }
      });
      res.json({ success: true, changes: this.changes });
    });
    stmt.finalize();
  });
});

router.get('/:id/recipe-items', (req, res) => {
  const sql = `
    SELECT ri.id, ri.ingredient_id, ri.quantity, i.name, i.unit
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.trial_version_id = ?
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

export default router;
