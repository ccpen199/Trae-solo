const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

router.get('/rules', checkPermission('config:view'), (req, res) => {
  const { category, status } = req.query;
  let sql = 'SELECT * FROM configuration_rules WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(sql);
  const rules = stmt.all(...params);
  
  res.json({ data: rules });
});

router.post('/rules', checkPermission('config:view'), (req, res) => {
  const { category, rule_name, rule_value, description, owner, effective_date, expiry_date } = req.body;
  
  if (!category || !rule_name || !rule_value) {
    return res.status(400).json({ error: '分类、规则名和规则值不能为空' });
  }
  
  if (category === 'price') {
    const numValue = parseFloat(rule_value);
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({ error: '价格类规则必须为非负数值' });
    }
  }
  if (category === 'permission') {
    if (!['true', 'false'].includes(rule_value.toLowerCase())) {
      return res.status(400).json({ error: '权限类规则必须是布尔值' });
    }
  }
  
  const id = `cfg-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO configuration_rules (id, category, rule_name, rule_value, description, owner, effective_date, expiry_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, category, rule_name, rule_value, description, owner, effective_date, expiry_date, req.user.id);
  
  logOperation(req, 'create', 'configuration', id);
  res.json({ data: { id } });
});

router.put('/rules/:id', checkPermission('config:view'), (req, res) => {
  const { rule_name, rule_value, description, owner, effective_date, expiry_date, status } = req.body;
  
  const checkStmt = db.prepare('SELECT * FROM configuration_rules WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '配置规则不存在' });
  }
  
  if (existing.category === 'price') {
    const numValue = parseFloat(rule_value);
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({ error: '价格类规则必须为非负数值' });
    }
  }
  if (existing.category === 'permission') {
    if (!['true', 'false'].includes(rule_value.toLowerCase())) {
      return res.status(400).json({ error: '权限类规则必须是布尔值' });
    }
  }
  
  const stmt = db.prepare(`
    UPDATE configuration_rules 
    SET rule_name = ?, rule_value = ?, description = ?, owner = ?, effective_date = ?, expiry_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(rule_name, rule_value, description, owner, effective_date, expiry_date, status || 'active', req.params.id);
  
  logOperation(req, 'update', 'configuration', req.params.id);
  res.json({ data: { id: req.params.id } });
});

router.get('/permissions', checkPermission('config:view'), (req, res) => {
  const stmt = db.prepare('SELECT * FROM permissions ORDER BY created_at DESC');
  const perms = stmt.all();
  
  res.json({ data: perms.map(p => ({ ...p, permissions: JSON.parse(p.permissions) })) });
});

router.get('/exceptions', checkPermission('log:view'), (req, res) => {
  const { task_id, handling_result } = req.query;
  let sql = `
    SELECT eh.*, qt.task_name 
    FROM exception_handlings eh 
    LEFT JOIN query_tasks qt ON eh.task_id = qt.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (task_id) {
    sql += ' AND eh.task_id = ?';
    params.push(task_id);
  }
  if (handling_result) {
    sql += ' AND eh.handling_result = ?';
    params.push(handling_result);
  }
  sql += ' ORDER BY eh.created_at DESC';
  
  const stmt = db.prepare(sql);
  const exceptions = stmt.all(...params);
  
  res.json({ data: exceptions });
});

router.get('/logs', checkPermission('log:view'), (req, res) => {
  const { user_id, operation, resource_type, limit = 100 } = req.query;
  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const params = [];
  
  if (user_id) {
    sql += ' AND user_id = ?';
    params.push(user_id);
  }
  if (operation) {
    sql += ' AND operation = ?';
    params.push(operation);
  }
  if (resource_type) {
    sql += ' AND resource_type = ?';
    params.push(resource_type);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const stmt = db.prepare(sql);
  const logs = stmt.all(...params);
  
  res.json({ data: logs });
});

router.get('/current-user', (req, res) => {
  res.json({ 
    data: req.user 
  });
});

module.exports = router;
