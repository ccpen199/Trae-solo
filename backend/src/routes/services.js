const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { category, keyword } = req.query;
  let sql = 'SELECT * FROM service_items WHERE status = ?';
  const params = ['active'];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (keyword) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const services = db.prepare(sql).all(...params);
  res.json(services);
});

router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: '服务事项不存在' });
  }
  res.json(service);
});

router.get('/category/:category', (req, res) => {
  const services = db.prepare('SELECT * FROM service_items WHERE category = ? AND status = ?').all(req.params.category, 'active');
  res.json(services);
});

router.get('/hot/list', (req, res) => {
  const services = db.prepare('SELECT * FROM service_items WHERE status = ? ORDER BY id LIMIT 8').all('active');
  res.json(services);
});

module.exports = router;
