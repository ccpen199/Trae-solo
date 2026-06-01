const express = require('express');
const db = require('../config/database');

const router = express.Router();

router.get('/cooperatives', (req, res) => {
  const { status = 'active' } = req.query;
  
  let whereClause = '1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const data = db.prepare(`SELECT * FROM cooperatives WHERE ${whereClause} ORDER BY id DESC`).all(...params);
  res.json({ success: true, data });
});

router.get('/cooperatives/:id', (req, res) => {
  const data = db.prepare('SELECT * FROM cooperatives WHERE id = ?').get(req.params.id);
  if (!data) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  res.json({ success: true, data });
});

router.post('/cooperatives', (req, res) => {
  const { name, contact_person, phone, address, guarantee_limit } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO cooperatives (name, contact_person, phone, address, guarantee_limit, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);
  
  const result = stmt.run(name, contact_person, phone, address, guarantee_limit || 0);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/stores', (req, res) => {
  const { status = 'active', cooperative_id } = req.query;
  
  let whereClause = '1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND s.status = ?';
    params.push(status);
  }
  
  if (cooperative_id) {
    whereClause += ' AND s.cooperative_id = ?';
    params.push(cooperative_id);
  }
  
  const data = db.prepare(`
    SELECT s.*, c.name as cooperative_name
    FROM stores s
    LEFT JOIN cooperatives c ON s.cooperative_id = c.id
    WHERE ${whereClause}
    ORDER BY s.id DESC
  `).all(...params);
  
  res.json({ success: true, data });
});

router.get('/stores/:id', (req, res) => {
  const data = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
  if (!data) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  res.json({ success: true, data });
});

router.post('/stores', (req, res) => {
  const { name, owner_name, phone, address, cooperative_id } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO stores (name, owner_name, phone, address, cooperative_id, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);
  
  const result = stmt.run(name, owner_name, phone, address, cooperative_id);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/products', (req, res) => {
  const { status = 'active', store_id, category } = req.query;
  
  let whereClause = '1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }
  
  if (store_id) {
    whereClause += ' AND p.store_id = ?';
    params.push(store_id);
  }
  
  if (category) {
    whereClause += ' AND p.category = ?';
    params.push(category);
  }
  
  const data = db.prepare(`
    SELECT p.*, s.name as store_name
    FROM products p
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE ${whereClause}
    ORDER BY p.id DESC
  `).all(...params);
  
  res.json({ success: true, data });
});

router.get('/products/:id', (req, res) => {
  const data = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!data) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  res.json({ success: true, data });
});

router.post('/products', (req, res) => {
  const { name, category, specification, unit, price, store_id, stock_quantity } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO products (name, category, specification, unit, price, store_id, stock_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  
  const result = stmt.run(name, category, specification, unit, price, store_id, stock_quantity || 0);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/categories', (req, res) => {
  const data = db.prepare(`
    SELECT DISTINCT category FROM products WHERE status = 'active' ORDER BY category
  `).all();
  
  res.json({ success: true, data: data.map(d => d.category) });
});

module.exports = router;
