const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { sku_id, quality_level } = req.query;
  let query = `
    SELECT i.*, s.sku_code, s.name, s.category, s.temperature_zone, s.is_weighed
    FROM inventory i
    JOIN skus s ON i.sku_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (sku_id) {
    query += ' AND i.sku_id = ?';
    params.push(sku_id);
  }
  if (quality_level) {
    query += ' AND i.quality_level = ?';
    params.push(quality_level);
  }
  
  query += ' ORDER BY i.created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

router.get('/available', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const items = db.prepare(`
    SELECT i.*, s.sku_code, s.name, s.category, s.temperature_zone, s.is_weighed, s.price, s.unit
    FROM inventory i
    JOIN skus s ON i.sku_id = s.id
    WHERE i.quality_level = 'normal'
    AND i.quantity > 0
    AND (i.expiry_date IS NULL OR i.expiry_date >= ?)
    ORDER BY s.name
  `).all(today);
  res.json(items);
});

router.post('/adjust', (req, res) => {
  const { inventory_id, quantity_change, operator, notes } = req.body;
  
  const result = db.prepare(`
    UPDATE inventory 
    SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quantity_change, inventory_id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Inventory not found' });
  }
  
  const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(inventory_id);
  
  db.prepare(`
    INSERT INTO inventory_logs 
    (inventory_id, sku_id, batch_no, change_type, quantity_change, operator, notes)
    VALUES (?, ?, ?, 'adjust', ?, ?, ?)
  `).run(inventory_id, inventory.sku_id, inventory.batch_no, quantity_change, operator, notes);
  
  res.json({ success: true });
});

router.get('/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT il.*, s.name as sku_name
    FROM inventory_logs il
    LEFT JOIN skus s ON il.sku_id = s.id
    ORDER BY il.created_at DESC
    LIMIT 100
  `).all();
  res.json(logs);
});

module.exports = router;
