const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const skus = db.prepare('SELECT * FROM skus ORDER BY name').all();
  res.json(skus);
});

router.post('/', (req, res) => {
  const { sku_code, name, category, temperature_zone, is_weighed, unit, price } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO skus (sku_code, name, category, temperature_zone, is_weighed, unit, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sku_code, name, category, temperature_zone, is_weighed ? 1 : 0, unit, price);
    
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
