const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { start_date, end_date, sale_type } = req.query;
  let sql = `
    SELECT s.*, r.name as recipe_name, l.name as liquor_name
    FROM sales s
    LEFT JOIN recipes r ON s.recipe_id = r.id
    LEFT JOIN liquors l ON s.liquor_id = l.id
    WHERE 1=1
  `;
  const params = [];
  
  if (start_date) {
    sql += ' AND DATE(s.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(s.created_at) <= ?';
    params.push(end_date);
  }
  if (sale_type) {
    sql += ' AND s.sale_type = ?';
    params.push(sale_type);
  }
  
  sql += ' ORDER BY s.created_at DESC';
  
  const sales = db.prepare(sql).all(...params);
  res.json(sales);
});

router.post('/', (req, res) => {
  const {
    recipe_id, liquor_id, sale_type, quantity, unit_price,
    is_complimentary, complimentary_reason, created_by, approver_id
  } = req.body;

  const transaction = db.transaction(() => {
    let total_amount = quantity * unit_price;
    let cost_amount = 0;
    
    if (recipe_id) {
      const recipe = db.prepare('SELECT standard_cost FROM recipes WHERE id = ?').get(recipe_id);
      if (recipe) {
        cost_amount = recipe.standard_cost * quantity;
      }
      
      const ingredients = db.prepare(`
        SELECT ri.*, l.bottle_volume_ml, l.total_bottles, l.opened_bottles
        FROM recipe_ingredients ri
        JOIN liquors l ON ri.liquor_id = l.id
        WHERE ri.recipe_id = ? AND ri.liquor_id IS NOT NULL
      `).all(recipe_id);
      
      for (let i = 0; i < quantity; i++) {
        for (const ing of ingredients) {
          if (ing.liquor_id) {
            const totalMlNeeded = ing.quantity_ml;
            let remainingMl = totalMlNeeded;
            
            if (ing.opened_bottles > 0) {
              const useFromOpened = Math.min(ing.opened_bottles, remainingMl);
              remainingMl -= useFromOpened;
              db.prepare(`
                UPDATE liquors SET opened_bottles = opened_bottles - ? WHERE id = ?
              `).run(useFromOpened, ing.liquor_id);
            }
            
            while (remainingMl > 0) {
              const fullBottle = db.prepare('SELECT total_bottles, bottle_volume_ml FROM liquors WHERE id = ?').get(ing.liquor_id);
              if (fullBottle.total_bottles <= 0) {
                throw new Error('库存不足: ' + ing.ingredient_name);
              }
              
              db.prepare(`
                UPDATE liquors SET total_bottles = total_bottles - 1 WHERE id = ?
              `).run(ing.liquor_id);
              
              const bottleMl = fullBottle.bottle_volume_ml;
              if (bottleMl > remainingMl) {
                db.prepare(`
                  UPDATE liquors SET opened_bottles = opened_bottles + ? WHERE id = ?
                `).run(bottleMl - remainingMl, ing.liquor_id);
                remainingMl = 0;
              } else {
                remainingMl -= bottleMl;
              }
            }
          }
        }
      }
    }
    
    if (liquor_id) {
      const liquor = db.prepare('SELECT cost_price, total_bottles FROM liquors WHERE id = ?').get(liquor_id);
      if (liquor && liquor.total_bottles >= quantity) {
        cost_amount = liquor.cost_price * quantity;
        db.prepare(`
          UPDATE liquors SET total_bottles = total_bottles - ? WHERE id = ?
        `).run(quantity, liquor_id);
      } else {
        throw new Error('库存不足');
      }
    }
    
    const result = db.prepare(`
      INSERT INTO sales (
        recipe_id, liquor_id, sale_type, quantity, unit_price, total_amount,
        cost_amount, is_complimentary, complimentary_reason, created_by, approver_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recipe_id || null, liquor_id || null, sale_type, quantity, unit_price,
      is_complimentary ? 0 : total_amount, cost_amount, is_complimentary ? 1 : 0,
      complimentary_reason || '', created_by || 1, approver_id || null
    );
    
    return result.lastInsertRowid;
  });
  
  try {
    const saleId = transaction();
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/report/daily', (req, res) => {
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split('T')[0];
  
  const dailySales = db.prepare(`
    SELECT
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue,
      SUM(cost_amount) as total_cost,
      SUM(total_amount) - SUM(cost_amount) as gross_profit,
      (SUM(total_amount) - SUM(cost_amount)) / SUM(total_amount) * 100 as gross_margin
    FROM sales
    WHERE DATE(created_at) = ?
  `).get(reportDate);
  
  const byRecipe = db.prepare(`
    SELECT
      r.name as recipe_name,
      SUM(s.quantity) as total_sold,
      SUM(s.total_amount) as total_revenue,
      SUM(s.cost_amount) as total_cost
    FROM sales s
    JOIN recipes r ON s.recipe_id = r.id
    WHERE DATE(s.created_at) = ?
    GROUP BY s.recipe_id
    ORDER BY total_sold DESC
  `).all(reportDate);
  
  res.json({
    date: reportDate,
    summary: dailySales,
    by_recipe: byRecipe
  });
});

module.exports = router;
