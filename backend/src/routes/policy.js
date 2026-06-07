const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, category, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = "WHERE status = '生效中'";
  const params = [];
  
  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }
  
  if (keyword) {
    whereClause += ' AND (title LIKE ? OR keywords LIKE ? OR content LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const list = db.prepare(`
    SELECT id, title, category, keywords, effective_date, created_at 
    FROM policy_knowledge
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM policy_knowledge
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/graph/relations', (req, res) => {
  const policies = db.prepare(`
    SELECT id, title, category, keywords FROM policy_knowledge WHERE status = '生效中' LIMIT 50
  `).all();
  
  const categories = {};
  policies.forEach(p => {
    if (!categories[p.category]) {
      categories[p.category] = [];
    }
    categories[p.category].push({ id: p.id, title: p.title });
  });
  
  res.json({
    nodes: policies.map(p => ({ id: p.id, label: p.title, category: p.category })),
    categories: Object.keys(categories),
    category_map: categories
  });
});

router.get('/:id', (req, res) => {
  const policy = db.prepare('SELECT * FROM policy_knowledge WHERE id = ?').get(req.params.id);
  
  if (!policy) {
    return res.status(404).json({ error: '政策不存在' });
  }
  res.json(policy);
});

router.post('/', (req, res) => {
  const { title, category, content, keywords, effective_date, expiry_date } = req.body;
  
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO policy_knowledge 
    (id, title, category, content, keywords, effective_date, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, category, content, keywords, effective_date, expiry_date);
  
  res.json({ id, ...req.body });
});

router.put('/:id', (req, res) => {
  const { title, category, content, keywords, effective_date, expiry_date, status } = req.body;
  
  db.prepare(`
    UPDATE policy_knowledge 
    SET title = ?, category = ?, content = ?, keywords = ?, effective_date = ?, expiry_date = ?, status = ?
    WHERE id = ?
  `).run(title, category, content, keywords, effective_date, expiry_date, status, req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM policy_knowledge WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
