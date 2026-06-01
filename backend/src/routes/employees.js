const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, position } = req.query;
  let sql = 'SELECT * FROM employees WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (position) {
    sql += ' AND position = ?';
    params.push(position);
  }
  
  const employees = db.prepare(sql).all(...params);
  res.json(employees);
});

router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) {
    return res.status(404).json({ error: '员工不存在' });
  }
  res.json(employee);
});

router.post('/', (req, res) => {
  const { code, name, position, phone } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO employees (code, name, position, phone)
      VALUES (?, ?, ?, ?)
    `).run(code, name, position, phone);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, position, phone, status } = req.body;
  db.prepare(`
    UPDATE employees SET name = ?, position = ?, phone = ?, status = ?
    WHERE id = ?
  `).run(name, position, phone, status, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

module.exports = router;
