const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, type, is_pointed, inspection_status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }
  
  if (is_pointed !== undefined) {
    whereClause += ' AND is_pointed = ?';
    params.push(is_pointed);
  }
  
  if (inspection_status) {
    whereClause += ' AND inspection_status = ?';
    params.push(inspection_status);
  }
  
  const list = db.prepare(`
    SELECT * FROM medical_institutions
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM medical_institutions
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const institution = db.prepare('SELECT * FROM medical_institutions WHERE id = ?').get(req.params.id);
  
  if (!institution) {
    return res.status(404).json({ error: '机构不存在' });
  }
  res.json(institution);
});

router.post('/', (req, res) => {
  const { name, type, level, address, contact, is_pointed } = req.body;
  
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO medical_institutions 
    (id, name, type, level, address, contact, is_pointed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, level, address, contact, is_pointed ? 1 : 0);
  
  res.json({ id, ...req.body });
});

router.put('/:id', (req, res) => {
  const { name, type, level, address, contact, is_pointed, inspection_status } = req.body;
  
  db.prepare(`
    UPDATE medical_institutions 
    SET name = ?, type = ?, level = ?, address = ?, contact = ?, is_pointed = ?, inspection_status = ?
    WHERE id = ?
  `).run(name, type, level, address, contact, is_pointed ? 1 : 0, inspection_status, req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM medical_institutions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/inspection', (req, res) => {
  const { inspection_status, last_inspection_date } = req.body;
  
  db.prepare(`
    UPDATE medical_institutions 
    SET inspection_status = ?, last_inspection_date = ?
    WHERE id = ?
  `).run(inspection_status, last_inspection_date, req.params.id);
  
  res.json({ id: req.params.id, inspection_status, last_inspection_date });
});

module.exports = router;
