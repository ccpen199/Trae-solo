const express = require('express');
const { getDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT * FROM service_categories 
    ORDER BY sort_order ASC
  `).all();
  
  res.json(categories);
});

router.get('/items', (req, res) => {
  const { categoryId, hot, keyword } = req.query;
  const db = getDb();
  
  let sql = 'SELECT * FROM service_items WHERE 1=1';
  const params = [];
  
  if (categoryId) {
    sql += ' AND category_id = ?';
    params.push(categoryId);
  }
  
  if (hot) {
    sql += ' AND is_hot = 1';
  }
  
  if (keyword) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  sql += ' ORDER BY is_hot DESC, sort_order ASC';
  
  const items = db.prepare(sql).all(...params);
  res.json(items);
});

router.get('/items/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare(`
    SELECT si.*, sc.name as category_name 
    FROM service_items si
    LEFT JOIN service_categories sc ON si.category_id = sc.id
    WHERE si.id = ?
  `).get(req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: '服务事项不存在' });
  }
  
  res.json(item);
});

router.post('/guide', authMiddleware, (req, res) => {
  const { query } = req.body;
  const db = getDb();
  
  const keywords = query.split(/\s+/);
  let sql = `
    SELECT si.*, sc.name as category_name,
      (CASE 
        WHEN si.name LIKE ? THEN 3
        WHEN si.name LIKE ? THEN 2
        ELSE 1
      END) as relevance
    FROM service_items si
    LEFT JOIN service_categories sc ON si.category_id = sc.id
    WHERE si.name LIKE ? OR si.description LIKE ?
    ORDER BY relevance DESC, is_hot DESC
    LIMIT 5
  `;
  
  const searchTerm = `%${query}%`;
  const items = db.prepare(sql).all(
    `${query}%`, `%${query}%`, searchTerm, searchTerm
  );
  
  const matchedMaterials = [];
  if (items.length > 0 && items[0].required_materials) {
    matchedMaterials.push(...JSON.parse(items[0].required_materials || '[]'));
  }
  
  res.json({
    query,
    matchedServices: items,
    suggestedMaterials: matchedMaterials,
    estimatedTime: items[0]?.handling_time || '待定'
  });
});

module.exports = router;
