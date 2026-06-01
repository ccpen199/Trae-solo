const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { status, type } = req.query;
  let sql = 'SELECT * FROM certificate_templates WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND certificate_type = ?';
    params.push(type);
  }
  sql += ' ORDER BY updated_at DESC';
  
  const templates = db.prepare(sql).all(...params).map(t => ({
    ...t,
    fields: JSON.parse(t.fields),
    signature_rules: t.signature_rules ? JSON.parse(t.signature_rules) : null,
    applicable_items: t.applicable_items ? JSON.parse(t.applicable_items) : null
  }));
  
  res.json({ success: true, data: templates });
});

router.get('/:id', (req, res) => {
  const template = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: '模板不存在' });
  }
  
  template.fields = JSON.parse(template.fields);
  template.signature_rules = template.signature_rules ? JSON.parse(template.signature_rules) : null;
  template.applicable_items = template.applicable_items ? JSON.parse(template.applicable_items) : null;
  
  res.json({ success: true, data: template });
});

router.get('/:id/history', (req, res) => {
  const history = db.prepare('SELECT * FROM template_history WHERE template_id = ? ORDER BY changed_at DESC').all(req.params.id).map(h => ({
    ...h,
    fields: JSON.parse(h.fields),
    signature_rules: h.signature_rules ? JSON.parse(h.signature_rules) : null,
    applicable_items: h.applicable_items ? JSON.parse(h.applicable_items) : null
  }));
  
  res.json({ success: true, data: history });
});

router.post('/', (req, res) => {
  const { template_code, template_name, certificate_type, fields, validity_period, validity_unit, signature_rules, applicable_items, created_by } = req.body;
  
  if (!template_code || !template_name || !certificate_type || !fields || !validity_period) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const existing = db.prepare('SELECT id FROM certificate_templates WHERE template_code = ?').get(template_code);
  if (existing) {
    return res.status(400).json({ success: false, message: '模板编码已存在' });
  }
  
  try {
    const info = db.prepare(`
      INSERT INTO certificate_templates 
      (template_code, template_name, certificate_type, fields, validity_period, validity_unit, signature_rules, applicable_items, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template_code,
      template_name,
      certificate_type,
      JSON.stringify(fields),
      validity_period,
      validity_unit || 'day',
      signature_rules ? JSON.stringify(signature_rules) : null,
      applicable_items ? JSON.stringify(applicable_items) : null,
      created_by || 'system'
    );
    
    res.json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { template_name, certificate_type, fields, validity_period, validity_unit, signature_rules, applicable_items, change_reason, changed_by } = req.body;
  const templateId = req.params.id;
  
  const oldTemplate = db.prepare('SELECT * FROM certificate_templates WHERE id = ?').get(templateId);
  if (!oldTemplate) {
    return res.status(404).json({ success: false, message: '模板不存在' });
  }
  
  try {
    db.prepare('INSERT INTO template_history (template_id, template_code, template_name, certificate_type, fields, validity_period, validity_unit, signature_rules, applicable_items, version, change_reason, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      templateId,
      oldTemplate.template_code,
      oldTemplate.template_name,
      oldTemplate.certificate_type,
      oldTemplate.fields,
      oldTemplate.validity_period,
      oldTemplate.validity_unit,
      oldTemplate.signature_rules,
      oldTemplate.applicable_items,
      oldTemplate.version,
      change_reason || '模板更新',
      changed_by || 'system'
    );
    
    db.prepare(`
      UPDATE certificate_templates 
      SET template_name = ?, certificate_type = ?, fields = ?, validity_period = ?, validity_unit = ?, signature_rules = ?, applicable_items = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      template_name || oldTemplate.template_name,
      certificate_type || oldTemplate.certificate_type,
      fields ? JSON.stringify(fields) : oldTemplate.fields,
      validity_period || oldTemplate.validity_period,
      validity_unit || oldTemplate.validity_unit,
      signature_rules ? JSON.stringify(signature_rules) : oldTemplate.signature_rules,
      applicable_items ? JSON.stringify(applicable_items) : oldTemplate.applicable_items,
      templateId
    );
    
    res.json({ success: true, message: '模板更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const templateId = req.params.id;
  
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE template_id = ?').get(templateId);
  if (certCount.count > 0) {
    return res.status(400).json({ success: false, message: '该模板已被使用，无法删除' });
  }
  
  db.prepare('DELETE FROM certificate_templates WHERE id = ?').run(templateId);
  res.json({ success: true, message: '删除成功' });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE certificate_templates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: '状态更新成功' });
});

module.exports = router;
