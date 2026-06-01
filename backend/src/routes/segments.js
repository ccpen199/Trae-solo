const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');

const segmentRuleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  card_levels: Joi.array().items(Joi.string()).optional(),
  min_bill_amount: Joi.number().min(0).optional(),
  max_bill_amount: Joi.number().min(0).optional(),
  industries: Joi.array().items(Joi.string()).optional(),
  risk_levels: Joi.array().items(Joi.string()).optional(),
  min_installment_history: Joi.number().min(0).optional(),
  exclude_existing: Joi.boolean().default(false),
  created_by: Joi.string().default('系统')
});

router.get('/rules', (req, res) => {
  const rules = db.prepare('SELECT * FROM segment_rules ORDER BY created_at DESC').all();
  rules.forEach(r => {
    if (r.card_levels) r.card_levels = JSON.parse(r.card_levels);
    if (r.industries) r.industries = JSON.parse(r.industries);
    if (r.risk_levels) r.risk_levels = JSON.parse(r.risk_levels);
  });
  res.json({ success: true, data: rules });
});

router.post('/rules', (req, res) => {
  const { error, value } = segmentRuleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const maxVersion = db.prepare('SELECT MAX(rule_version) as max FROM segment_rules WHERE name = ?').get(value.name);
  const versionNum = maxVersion.max ? parseInt(maxVersion.max.replace('v', '')) + 1 : 1;
  const rule_version = `v${versionNum}`;
  
  const stmt = db.prepare(`
    INSERT INTO segment_rules
    (name, rule_version, card_levels, min_bill_amount, max_bill_amount, industries, risk_levels, min_installment_history, exclude_existing, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    value.name,
    rule_version,
    value.card_levels ? JSON.stringify(value.card_levels) : null,
    value.min_bill_amount,
    value.max_bill_amount,
    value.industries ? JSON.stringify(value.industries) : null,
    value.risk_levels ? JSON.stringify(value.risk_levels) : null,
    value.min_installment_history,
    value.exclude_existing ? 1 : 0,
    value.created_by
  );
  
  res.json({ success: true, data: { id: result.lastInsertRowid, rule_version, ...value } });
});

router.post('/generate/:ruleId', (req, res) => {
  const ruleId = req.params.ruleId;
  const rule = db.prepare('SELECT * FROM segment_rules WHERE id = ?').get(ruleId);
  
  if (!rule) {
    return res.status(404).json({ success: false, message: '规则不存在' });
  }
  
  let query = 'SELECT id FROM customers WHERE is_excluded = 0';
  const params = [];
  
  if (rule.card_levels) {
    const levels = JSON.parse(rule.card_levels);
    if (levels.length > 0) {
      query += ` AND card_level IN (${levels.map(() => '?').join(',')})`;
      params.push(...levels);
    }
  }
  
  if (rule.min_bill_amount) {
    query += ' AND bill_amount >= ?';
    params.push(rule.min_bill_amount);
  }
  if (rule.max_bill_amount) {
    query += ' AND bill_amount <= ?';
    params.push(rule.max_bill_amount);
  }
  
  if (rule.risk_levels) {
    const risks = JSON.parse(rule.risk_levels);
    if (risks.length > 0) {
      query += ` AND risk_level IN (${risks.map(() => '?').join(',')})`;
      params.push(...risks);
    }
  }
  
  if (rule.min_installment_history) {
    query += ' AND installment_history_count >= ?';
    params.push(rule.min_installment_history);
  }
  
  if (rule.industries) {
    const industries = JSON.parse(rule.industries);
    if (industries.length > 0) {
      const conditions = industries.map(() => 'consumption_industries LIKE ?').join(' OR ');
      query += ` AND (${conditions})`;
      params.push(...industries.map(i => `%${i}%`));
    }
  }
  
  const customers = db.prepare(query).all(...params);
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO customer_segments (segment_rule_id, customer_id, rule_version)
    VALUES (?, ?, ?)
  `);
  
  db.transaction(() => {
    customers.forEach(c => {
      insertStmt.run(ruleId, c.id, rule.rule_version);
    });
  })();
  
  res.json({ 
    success: true, 
    message: `成功生成客群，共${customers.length}位客户`,
    count: customers.length
  });
});

router.get('/segments/:ruleId', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const count = db.prepare(`
    SELECT COUNT(*) as total FROM customer_segments cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.segment_rule_id = ?
  `).get(req.params.ruleId).total;
  
  const segments = db.prepare(`
    SELECT cs.*, c.name, c.card_no, c.phone, c.card_level, c.bill_amount, c.risk_level
    FROM customer_segments cs
    JOIN customers c ON cs.customer_id = c.id
    WHERE cs.segment_rule_id = ?
    ORDER BY cs.generated_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.ruleId, parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: segments,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count
    }
  });
});

router.delete('/rules/:id', (req, res) => {
  db.prepare('DELETE FROM customer_segments WHERE segment_rule_id = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM segment_rules WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '规则不存在' });
  }
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
