const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { category, active } = req.query;

  let sql = 'SELECT * FROM point_rules WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY id DESC';
  const rules = db.prepare(sql).all(...params);

  res.json(rules);
});

router.get('/:id', (req, res) => {
  const rule = db.prepare('SELECT * FROM point_rules WHERE id = ?').get(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }

  const versions = db.prepare('SELECT * FROM point_rule_versions WHERE rule_id = ? ORDER BY version DESC').all(req.params.id);

  res.json({ ...rule, versions });
});

router.post('/', (req, res) => {
  const { name, category, points, description, created_by } = req.body;

  if (!name || !category || points === undefined) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const result = db.prepare(`
    INSERT INTO point_rules (name, category, points, description, version, is_active, created_by)
    VALUES (?, ?, ?, ?, 1, 1, ?)
  `).run(name, category, points, description || null, created_by || 'admin');

  const rule = db.prepare('SELECT * FROM point_rules WHERE id = ?').get(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO point_rule_versions (rule_id, name, category, points, description, version, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, 1, ?, '初始版本')
  `).run(rule.id, name, category, points, description || null, created_by || 'admin');

  res.json(rule);
});

router.put('/:id', (req, res) => {
  const { name, category, points, description, is_active, changed_by, change_reason } = req.body;

  const rule = db.prepare('SELECT * FROM point_rules WHERE id = ?').get(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }

  const newVersion = rule.version + 1;

  db.prepare(`
    UPDATE point_rules
    SET name = ?, category = ?, points = ?, description = ?, version = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category, points, description || null, newVersion, is_active !== undefined ? (is_active ? 1 : 0) : rule.is_active, req.params.id);

  db.prepare(`
    INSERT INTO point_rule_versions (rule_id, name, category, points, description, version, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, name, category, points, description || null, newVersion, changed_by || 'admin', change_reason || '修改规则');

  const updated = db.prepare('SELECT * FROM point_rules WHERE id = ?').get(req.params.id);

  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE point_rules SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
