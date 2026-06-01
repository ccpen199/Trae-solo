const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { material_id, supplier_id, is_active, show_inactive } = req.query;
  let sql = `
    SELECT mp.*, m.name as material_name, m.code as material_code, s.name as supplier_name, m.status as material_status
    FROM material_prices mp
    LEFT JOIN materials m ON mp.material_id = m.id
    LEFT JOIN suppliers s ON mp.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (show_inactive !== 'true') {
    sql += ' AND m.status = ?';
    params.push('active');
  }
  if (material_id) {
    sql += ' AND mp.material_id = ?';
    params.push(material_id);
  }
  if (supplier_id) {
    sql += ' AND mp.supplier_id = ?';
    params.push(supplier_id);
  }
  if (is_active !== undefined) {
    sql += ' AND mp.is_active = ?';
    params.push(is_active);
  }
  sql += ' ORDER BY mp.created_at DESC';
  
  const prices = db.prepare(sql).all(...params);
  res.json(prices);
});

router.get('/latest', (req, res) => {
  const prices = db.prepare(`
    SELECT mp.*, m.name as material_name
    FROM material_prices mp
    INNER JOIN materials m ON mp.material_id = m.id
    WHERE mp.is_active = 1 AND m.status = 'active'
    AND mp.id IN (
      SELECT MAX(id) FROM material_prices 
      WHERE is_active = 1 
      AND material_id IN (SELECT id FROM materials WHERE status = 'active')
      GROUP BY material_id
    )
  `).all();
  res.json(prices);
});

router.get('/:id', (req, res) => {
  const price = db.prepare(`
    SELECT mp.*, m.name as material_name, s.name as supplier_name
    FROM material_prices mp
    LEFT JOIN materials m ON mp.material_id = m.id
    LEFT JOIN suppliers s ON mp.supplier_id = s.id
    WHERE mp.id = ?
  `).get(req.params.id);
  
  if (!price) {
    return res.status(404).json({ error: '价格记录不存在' });
  }
  res.json(price);
});

router.post('/', (req, res) => {
  const { material_id, supplier_id, batch_no, price, currency, unit, valid_from, valid_to } = req.body;
  
  try {
    db.prepare('UPDATE material_prices SET is_active = 0 WHERE material_id = ? AND is_active = 1').run(material_id);
    
    const result = db.prepare(`
      INSERT INTO material_prices (material_id, supplier_id, batch_no, price, currency, unit, valid_from, valid_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(material_id, supplier_id, batch_no, price, currency || 'CNY', unit, valid_from, valid_to);
    
    res.json({ id: result.lastInsertRowid, price });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { price, currency, unit, valid_from, valid_to, is_active } = req.body;
  
  try {
    db.prepare(`
      UPDATE material_prices 
      SET price = ?, currency = ?, unit = ?, valid_from = ?, valid_to = ?, is_active = ?
      WHERE id = ?
    `).run(price, currency, unit, valid_from, valid_to, is_active, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE material_prices SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/suppliers/list', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(suppliers);
});

router.post('/suppliers', (req, res) => {
  const { name, code, contact, phone, email, address } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO suppliers (name, code, contact, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, code, contact, phone, email, address);
    res.json({ id: result.lastInsertRowid, name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
