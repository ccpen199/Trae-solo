const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, c.name as cup_name, c.volume_ml as cup_volume
    FROM recipes r
    LEFT JOIN cup_types c ON r.cup_type_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  const recipes = db.prepare(sql).all(...params);
  res.json(recipes);
});

router.get('/:id', (req, res) => {
  const recipe = db.prepare(`
    SELECT r.*, c.name as cup_name, c.volume_ml as cup_volume
    FROM recipes r
    LEFT JOIN cup_types c ON r.cup_type_id = c.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  
  const ingredients = db.prepare(`
    SELECT ri.*, l.name as liquor_name, l.cost_price, l.bottle_volume_ml
    FROM recipe_ingredients ri
    LEFT JOIN liquors l ON ri.liquor_id = l.id
    WHERE ri.recipe_id = ?
  `).all(req.params.id);
  
  recipe.ingredients = ingredients;
  res.json(recipe);
});

router.post('/', (req, res) => {
  const {
    name, cup_type_id, sale_price, preparation_steps, ingredients, created_by
  } = req.body;

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO recipes (name, cup_type_id, sale_price, preparation_steps, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, cup_type_id || null, sale_price, preparation_steps || '', created_by || 1);
    
    const recipeId = result.lastInsertRowid;
    let totalCost = 0;
    
    if (ingredients && ingredients.length > 0) {
      const insertIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_id, liquor_id, ingredient_name, type, quantity_ml, unit_cost)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const ing of ingredients) {
        let unitCost = 0;
        if (ing.liquor_id) {
          const liquor = db.prepare('SELECT cost_price, bottle_volume_ml FROM liquors WHERE id = ?').get(ing.liquor_id);
          if (liquor && liquor.bottle_volume_ml > 0) {
            unitCost = (liquor.cost_price / liquor.bottle_volume_ml) * ing.quantity_ml;
          }
        }
        totalCost += unitCost;
        
        insertIngredient.run(
          recipeId, ing.liquor_id || null, ing.ingredient_name,
          ing.type, ing.quantity_ml, unitCost
        );
      }
    }
    
    db.prepare('UPDATE recipes SET standard_cost = ? WHERE id = ?').run(totalCost, recipeId);
    
    return recipeId;
  });
  
  try {
    const recipeId = transaction();
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const {
    name, cup_type_id, sale_price, preparation_steps, ingredients, status
  } = req.body;

  const recipeId = req.params.id;
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE recipes SET
        name = ?, cup_type_id = ?, sale_price = ?, preparation_steps = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, cup_type_id || null, sale_price, preparation_steps || '', status || 'draft', recipeId);
    
    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(recipeId);
    
    let totalCost = 0;
    
    if (ingredients && ingredients.length > 0) {
      const insertIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_id, liquor_id, ingredient_name, type, quantity_ml, unit_cost)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const ing of ingredients) {
        let unitCost = 0;
        if (ing.liquor_id) {
          const liquor = db.prepare('SELECT cost_price, bottle_volume_ml FROM liquors WHERE id = ?').get(ing.liquor_id);
          if (liquor && liquor.bottle_volume_ml > 0) {
            unitCost = (liquor.cost_price / liquor.bottle_volume_ml) * ing.quantity_ml;
          }
        }
        totalCost += unitCost;
        
        insertIngredient.run(
          recipeId, ing.liquor_id || null, ing.ingredient_name,
          ing.type, ing.quantity_ml, unitCost
        );
      }
    }
    
    db.prepare('UPDATE recipes SET standard_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(totalCost, recipeId);
  });
  
  try {
    transaction();
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  const { approved_by } = req.body;
  const recipeId = req.params.id;
  
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  
  db.prepare(`
    UPDATE recipes SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approved_by || 1, recipeId);
  
  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  res.json(updated);
});

module.exports = router;
