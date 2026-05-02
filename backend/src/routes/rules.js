const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRoles('admin'), (req, res) => {
  const { rule_type, is_active } = req.query;

  let query = 'SELECT * FROM rules WHERE 1=1';
  const params = [];

  if (rule_type) {
    query += ' AND rule_type = ?';
    params.push(rule_type);
  }

  if (is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC';

  const rules = db.prepare(query).all(...params);

  rules.forEach(rule => {
    try {
      rule.config = JSON.parse(rule.config);
    } catch (e) {
      // 保持原样
    }
  });

  res.json(rules);
});

router.post('/', authenticateToken, requireRoles('admin'), (req, res) => {
  const { name, rule_type, config } = req.body;

  if (!name || !rule_type || !config) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const ruleId = uuidv4();

  db.prepare(`
    INSERT INTO rules (id, name, rule_type, config)
    VALUES (?, ?, ?, ?)
  `).run(
    ruleId,
    name,
    rule_type,
    typeof config === 'string' ? config : JSON.stringify(config)
  );

  res.status(201).json({
    id: ruleId,
    name,
    message: '规则已创建'
  });
});

router.put('/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { name, config, is_active } = req.body;

  const rule = db.prepare('SELECT * FROM rules WHERE id = ?').get(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }

  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }

  if (config) {
    updates.push('config = ?');
    params.push(typeof config === 'string' ? config : JSON.stringify(config));
  }

  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push('updated_at = strftime("%s", "now")');
    params.push(req.params.id);

    db.prepare(`UPDATE rules SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  res.json({ message: '规则已更新' });
});

router.get('/alerts', authenticateToken, (req, res) => {
  const { status, severity, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' AND 1=1';
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const alerts = db.prepare(query).all(...params);

  res.json({
    data: alerts,
    pagination: {
      page: Number(page),
      limit: Number(limit)
    }
  });
});

router.post('/alerts/:id/resolve', authenticateToken, requireRoles('admin', 'devops'), (req, res) => {
  const { resolution } = req.body;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = 'resolved', resolved_at = strftime("%s", "now")
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: '告警已解决' });
});

router.post('/alerts/:id/suppress', authenticateToken, requireRoles('admin', 'devops'), (req, res) => {
  const { suppress_until_minutes } = req.body;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  const suppressUntil = Math.floor(Date.now() / 1000) + (suppress_until_minutes || 60) * 60;

  db.prepare(`
    UPDATE alerts 
    SET status = 'suppressed', suppressed_until = ?
    WHERE id = ?
  `).run(suppressUntil, req.params.id);

  res.json({ message: '告警已抑制' });
});

module.exports = router;
