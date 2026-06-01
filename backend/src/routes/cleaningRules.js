const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

router.get('/', checkPermission('task:view'), (req, res) => {
  const { rule_type, status } = req.query;
  let sql = 'SELECT * FROM cleaning_rules WHERE 1=1';
  const params = [];
  
  if (rule_type) {
    sql += ' AND rule_type = ?';
    params.push(rule_type);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY priority DESC, created_at DESC';
  
  const stmt = db.prepare(sql);
  const rules = stmt.all(...params);
  
  res.json({ data: rules });
});

router.get('/:id', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare('SELECT * FROM cleaning_rules WHERE id = ?');
  const rule = stmt.get(req.params.id);
  
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  res.json({ data: rule });
});

router.post('/', checkPermission('task:create'), (req, res) => {
  const { name, rule_type, rule_content, priority } = req.body;
  
  if (!name || !rule_type || !rule_content) {
    return res.status(400).json({ error: '名称、类型和内容不能为空' });
  }
  
  const id = `cr-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO cleaning_rules (id, name, rule_type, rule_content, priority, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, rule_type, rule_content, priority || 0, req.user.id);
  
  logOperation(req, 'create', 'cleaning_rule', id);
  res.json({ data: { id } });
});

router.put('/:id', checkPermission('task:create'), (req, res) => {
  const { name, rule_type, rule_content, priority, status } = req.body;
  
  const checkStmt = db.prepare('SELECT * FROM cleaning_rules WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE cleaning_rules 
    SET name = ?, rule_type = ?, rule_content = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, rule_type, rule_content, priority || 0, status || 'active', req.params.id);
  
  logOperation(req, 'update', 'cleaning_rule', req.params.id);
  res.json({ data: { id: req.params.id } });
});

router.delete('/:id', checkPermission('task:create'), (req, res) => {
  const checkStmt = db.prepare('SELECT * FROM cleaning_rules WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM cleaning_rules WHERE id = ?');
  stmt.run(req.params.id);
  
  logOperation(req, 'delete', 'cleaning_rule', req.params.id);
  res.json({ data: { success: true } });
});

module.exports = router;
