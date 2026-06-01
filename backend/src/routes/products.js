const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { category, status } = req.query;
  let sql = 'SELECT * FROM warranty_products WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  
  const products = db.prepare(sql).all(...params);
  res.json({ success: true, data: products });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM warranty_products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  res.json({ success: true, data: product });
});

router.post('/', (req, res) => {
  const { name, description, category, coverage_scope, duration_months, price, deductible, max_service_count } = req.body;
  
  const info = db.prepare(`
    INSERT INTO warranty_products (name, description, category, coverage_scope, duration_months, price, deductible, max_service_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, category, coverage_scope, duration_months, price, deductible || 0, max_service_count || 1);
  
  res.json({ success: true, data: { id: info.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { name, description, category, coverage_scope, duration_months, price, deductible, max_service_count, status } = req.body;
  
  db.prepare(`
    UPDATE warranty_products 
    SET name = ?, description = ?, category = ?, coverage_scope = ?, duration_months = ?, price = ?, deductible = ?, max_service_count = ?, status = ?
    WHERE id = ?
  `).run(name, description, category, coverage_scope, duration_months, price, deductible, max_service_count, status || 'active', req.params.id);
  
  res.json({ success: true, message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM warranty_products WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
