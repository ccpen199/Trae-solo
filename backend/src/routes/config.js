const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/rules', (req, res) => {
  const { ruleType, status } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (ruleType) {
    whereClause += ' AND rule_type = ?';
    params.push(ruleType);
  }
  
  if (status !== undefined) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const rules = db.prepare(`
    SELECT cr.*, u.name as owner_name
    FROM config_rules cr
    LEFT JOIN users u ON cr.owner_id = u.id
    ${whereClause}
    ORDER BY sort_order ASC, created_at DESC
  `).all(...params);
  
  res.json({ list: rules });
});

router.get('/rules/:id', (req, res) => {
  const rule = db.prepare('SELECT * FROM config_rules WHERE id = ?').get(req.params.id);
  
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  res.json(rule);
});

router.post('/rules', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { rule_code, rule_name, rule_type, rule_expression, risk_score, owner_id, valid_from, valid_to, sort_order, remark } = req.body;
  
  if (!rule_code || !rule_name || !rule_type) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }
  
  const existing = db.prepare('SELECT id FROM config_rules WHERE rule_code = ?').get(rule_code);
  if (existing) {
    return res.status(400).json({ error: '规则编码已存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO config_rules (rule_code, rule_name, rule_type, rule_expression, risk_score, owner_id, valid_from, valid_to, sort_order, remark, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rule_code, rule_name, rule_type, rule_expression, risk_score || 0, owner_id || null, valid_from || null, valid_to || null, sort_order || 0, remark, req.user.id);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/rules/:id', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { rule_name, rule_type, rule_expression, risk_score, owner_id, valid_from, valid_to, status, sort_order, remark } = req.body;
  
  const rule = db.prepare('SELECT * FROM config_rules WHERE id = ?').get(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  const newVersion = rule.version + 1;
  
  db.prepare(`
    UPDATE config_rules 
    SET rule_name = ?, rule_type = ?, rule_expression = ?, risk_score = ?, owner_id = ?, 
        valid_from = ?, valid_to = ?, status = ?, sort_order = ?, remark = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rule_name, rule_type, rule_expression, risk_score, owner_id || null, valid_from || null, valid_to || null, status, sort_order || 0, remark, newVersion, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.delete('/rules/:id', roleMiddleware(['admin']), (req, res) => {
  db.prepare('DELETE FROM config_rules WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/users', (req, res) => {
  const { role, status } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  
  if (status !== undefined) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const users = db.prepare(`
    SELECT id, username, name, role, email, phone, department, status, created_at
    FROM users ${whereClause}
    ORDER BY created_at DESC
  `).all(...params);
  
  res.json({ list: users });
});

router.get('/current-user', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
