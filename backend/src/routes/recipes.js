const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { category, status, type } = req.query;
  let sql = 'SELECT * FROM recipes WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY created_at DESC';
  
  const recipes = db.prepare(sql).all(...params);
  res.json(recipes);
});

router.get('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  
  const materials = db.prepare(`
    SELECT rm.*, m.name as material_name, m.code as material_code, m.unit as base_unit
    FROM recipe_materials rm
    LEFT JOIN materials m ON rm.material_id = m.id
    WHERE rm.recipe_id = ?
    ORDER BY rm.sort_order
  `).all(req.params.id);
  
  const alternatives = db.prepare(`
    SELECT ra.*, m.name as alternative_name, m.code as alternative_code
    FROM recipe_alternatives ra
    LEFT JOIN materials m ON ra.alternative_material_id = m.id
    WHERE ra.recipe_material_id IN (
      SELECT id FROM recipe_materials WHERE recipe_id = ?
    )
  `).all(req.params.id);
  
  materials.forEach(m => {
    m.alternatives = alternatives.filter(a => a.recipe_material_id === m.id);
  });
  
  const packaging = db.prepare(`
    SELECT rp.*, pm.name as packaging_name, pm.unit_price, pm.type
    FROM recipe_packaging rp
    LEFT JOIN packaging_materials pm ON rp.packaging_id = pm.id
    WHERE rp.recipe_id = ?
  `).all(req.params.id);
  
  const labor = db.prepare('SELECT * FROM labor_costs WHERE recipe_id = ?').all(req.params.id);
  
  res.json({ ...recipe, materials, packaging, labor });
});

router.post('/', (req, res) => {
  const { name, code, version, category, status, type, description, process_loss_rate } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO recipes (name, code, version, category, status, type, description, process_loss_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, version || '1.0', category, status || 'draft', type || 'formal', description, process_loss_rate || 0);
    
    res.json({ id: result.lastInsertRowid, name, code });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, code, version, category, status, type, description, process_loss_rate } = req.body;
  
  try {
    db.prepare(`
      UPDATE recipes 
      SET name = ?, code = ?, version = ?, category = ?, status = ?, type = ?, description = ?, process_loss_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, code, version, category, status, type, description, process_loss_rate, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE recipes SET status = ? WHERE id = ?').run('archived', req.params.id);
  res.json({ success: true });
});

router.post('/:id/materials', (req, res) => {
  const { material_id, quantity, unit, loss_rate, sort_order, remark } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO recipe_materials (recipe_id, material_id, quantity, unit, loss_rate, sort_order, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, material_id, quantity, unit, loss_rate || 0, sort_order || 0, remark);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/materials/:materialId', (req, res) => {
  const { quantity, unit, loss_rate, sort_order, remark } = req.body;
  
  try {
    db.prepare(`
      UPDATE recipe_materials 
      SET quantity = ?, unit = ?, loss_rate = ?, sort_order = ?, remark = ?
      WHERE id = ? AND recipe_id = ?
    `).run(quantity, unit, loss_rate, sort_order, remark, req.params.materialId, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/materials/:materialId', (req, res) => {
  db.prepare('DELETE FROM recipe_materials WHERE id = ? AND recipe_id = ?').run(req.params.materialId, req.params.id);
  res.json({ success: true });
});

router.get('/packaging/list', (req, res) => {
  const packaging = db.prepare('SELECT * FROM packaging_materials WHERE status = ? ORDER BY name').all('active');
  res.json(packaging);
});

router.post('/:id/packaging', (req, res) => {
  const { packaging_id, quantity } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO recipe_packaging (recipe_id, packaging_id, quantity)
      VALUES (?, ?, ?)
    `).run(req.params.id, packaging_id, quantity || 1);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/packaging/:packagingId', (req, res) => {
  db.prepare('DELETE FROM recipe_packaging WHERE id = ? AND recipe_id = ?').run(req.params.packagingId, req.params.id);
  res.json({ success: true });
});

router.post('/:id/labor', (req, res) => {
  const { process_name, labor_hours, hourly_rate } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO labor_costs (recipe_id, process_name, labor_hours, hourly_rate)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, process_name, labor_hours || 0, hourly_rate || 0);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/labor/:laborId', (req, res) => {
  db.prepare('DELETE FROM labor_costs WHERE id = ? AND recipe_id = ?').run(req.params.laborId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
