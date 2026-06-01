const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/rules', (req, res) => {
  const { rule_type, status } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (rule_type) {
    whereClause += ' AND r.rule_type = ?';
    params.push(rule_type);
  }
  if (status) {
    whereClause += ' AND r.status = ?';
    params.push(status);
  }

  const rules = db.prepare(`
    SELECT r.*, owner.name as owner_name, creator.name as creator_name
    FROM config_rules r
    LEFT JOIN users owner ON r.owner_id = owner.id
    LEFT JOIN users creator ON r.created_by = creator.id
    ${whereClause}
    ORDER BY r.created_at DESC
  `).all(...params);

  res.json(rules);
});

router.post('/rules', (req, res) => {
  const { rule_name, category, rule_type, rule_content, description, owner_id, valid_from, valid_to } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO config_rules (rule_name, category, rule_type, rule_content, description, owner_id, valid_from, valid_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(rule_name, category, rule_type, rule_content, description || '', owner_id || req.user.id, valid_from || null, valid_to || null, req.user.id);

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '规则名称已存在' });
    }
    throw error;
  }
});

router.put('/rules/:id', (req, res) => {
  const ruleId = req.params.id;
  const { rule_name, category, rule_type, rule_content, description, owner_id, valid_from, valid_to, status } = req.body;

  db.prepare(`
    UPDATE config_rules 
    SET rule_name = COALESCE(?, rule_name),
        category = COALESCE(?, category),
        rule_type = COALESCE(?, rule_type),
        rule_content = COALESCE(?, rule_content),
        description = COALESCE(?, description),
        owner_id = COALESCE(?, owner_id),
        valid_from = COALESCE(?, valid_from),
        valid_to = COALESCE(?, valid_to),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rule_name, category, rule_type, rule_content, description, owner_id, valid_from, valid_to, status, ruleId);

  res.json({ message: '更新成功' });
});

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, role, email, status, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users);
});

router.get('/audit-logs', (req, res) => {
  const { page = 1, pageSize = 20, user_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (user_id) {
    whereClause += ' AND p.user_id = ?';
    params.push(user_id);
  }

  const logs = db.prepare(`
    SELECT p.*, u.name as user_name
    FROM permission_audit_logs p
    LEFT JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM permission_audit_logs p ${whereClause}
  `).get(...params);

  res.json({
    list: logs,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/operation-logs', (req, res) => {
  const { page = 1, pageSize = 20, module } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (module) {
    whereClause += ' AND o.module = ?';
    params.push(module);
  }

  const logs = db.prepare(`
    SELECT o.*, u.name as user_name
    FROM operation_logs o
    LEFT JOIN users u ON o.user_id = u.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json(logs);
});

module.exports = router;
