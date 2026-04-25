const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const competitors = db.prepare(`
    SELECT c.*, 
           COUNT(p.id) as product_count,
           MIN(p.current_price) as min_price,
           MAX(p.current_price) as max_price
    FROM competitors c
    LEFT JOIN product_prices p ON c.id = p.competitor_id
    GROUP BY c.id
  `).all();
  res.json(competitors);
});

router.get('/:id', (req, res) => {
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(req.params.id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  const products = db.prepare(`
    SELECT * FROM product_prices WHERE competitor_id = ?
  `).all(req.params.id);
  
  res.json({ ...competitor, products });
});

router.post('/', (req, res) => {
  const { name, url, category, platform } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  
  const result = db.prepare(`
    INSERT INTO competitors (name, url, category, platform)
    VALUES (?, ?, ?, ?)
  `).run(name, url, category || '', platform || '');
  
  const newCompetitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(result.lastInsertRowid);
  
  res.status(201).json(newCompetitor);
});

router.put('/:id', (req, res) => {
  const { name, url, category, platform } = req.body;
  
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(req.params.id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  db.prepare(`
    UPDATE competitors 
    SET name = ?, url = ?, category = ?, platform = ?
    WHERE id = ?
  `).run(
    name || competitor.name,
    url || competitor.url,
    category !== undefined ? category : competitor.category,
    platform !== undefined ? platform : competitor.platform,
    req.params.id
  );
  
  const updatedCompetitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(req.params.id);
  
  res.json(updatedCompetitor);
});

router.delete('/:id', (req, res) => {
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(req.params.id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  db.transaction(() => {
    db.prepare(`DELETE FROM product_prices WHERE competitor_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM alerts WHERE competitor_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM competitors WHERE id = ?`).run(req.params.id);
  })();
  
  res.json({ message: 'Competitor deleted successfully' });
});

module.exports = router;
