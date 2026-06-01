const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, category } = req.query;
  let sql = `
    SELECT p.*, s.name as supplier_name 
    FROM products p 
    LEFT JOIN suppliers s ON p.supplier_id = s.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }
  
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, s.name as supplier_name 
    FROM products p 
    LEFT JOIN suppliers s ON p.supplier_id = s.id 
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  res.json(product);
});

router.post('/', (req, res) => {
  const { code, name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO products (code, name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty || 1);
    
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty, status } = req.body;
  
  db.prepare(`
    UPDATE products 
    SET name = ?, category = ?, spec = ?, unit = ?, supplier_id = ?, 
        price = ?, shelf_life_days = ?, min_order_qty = ?, status = ?
    WHERE id = ?
  `).run(name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty, status, req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ id: req.params.id, status });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL').all();
  res.json(categories.map(c => c.category));
});

module.exports = router;
