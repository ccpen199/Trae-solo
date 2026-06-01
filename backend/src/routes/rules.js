const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rules = db.prepare('SELECT * FROM risk_rules ORDER BY created_at DESC').all();
  res.json({ data: rules });
});

router.post('/', (req, res) => {
  const { rule_code, rule_name, rule_type, description, score_weight, condition_json } = req.body;
  
  const result = db.prepare(`
    INSERT INTO risk_rules (rule_code, rule_name, rule_version, rule_type, description, score_weight, condition_json)
    VALUES (?, ?, 1, ?, ?, ?, ?)
  `).run(rule_code, rule_name, rule_type, description || null, score_weight, JSON.stringify(condition_json));
  
  const rule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rule);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { rule_name, rule_type, description, score_weight, condition_json, is_active } = req.body;
  
  const currentRule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(id);
  if (!currentRule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  db.prepare(`
    UPDATE risk_rules 
    SET rule_name = ?, rule_type = ?, description = ?, score_weight = ?, condition_json = ?, is_active = ?, rule_version = rule_version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rule_name, rule_type, description || null, score_weight, JSON.stringify(condition_json), is_active ? 1 : 0, id);
  
  const rule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(id);
  res.json(rule);
});

module.exports = router;
