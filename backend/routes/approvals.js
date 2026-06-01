const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { status, template_id, applicant_id } = req.query;
  let sql = `
    SELECT ai.*, 
           t.template_name, t.template_code,
           a.applicant_name, a.id_number
    FROM approval_items ai
    LEFT JOIN certificate_templates t ON ai.template_id = t.id
    LEFT JOIN applicants a ON ai.applicant_id = a.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND ai.status = ?';
    params.push(status);
  }
  if (template_id) {
    sql += ' AND ai.template_id = ?';
    params.push(template_id);
  }
  if (applicant_id) {
    sql += ' AND ai.applicant_id = ?';
    params.push(applicant_id);
  }
  sql += ' ORDER BY ai.created_at DESC';
  
  const items = db.prepare(sql).all(...params);
  res.json({ success: true, data: items });
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT ai.*, 
           t.template_name, t.template_code, t.fields,
           a.applicant_name, a.id_type, a.id_number, a.phone, a.email
    FROM approval_items ai
    LEFT JOIN certificate_templates t ON ai.template_id = t.id
    LEFT JOIN applicants a ON ai.applicant_id = a.id
    WHERE ai.id = ?
  `).get(req.params.id);
  
  if (!item) {
    return res.status(404).json({ success: false, message: '审批事项不存在' });
  }
  
  item.fields = JSON.parse(item.fields);
  res.json({ success: true, data: item });
});

router.post('/', (req, res) => {
  const { item_code, item_name, template_id, applicant_id, remark } = req.body;
  
  if (!item_code || !item_name || !template_id || !applicant_id) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const existing = db.prepare('SELECT id FROM approval_items WHERE item_code = ?').get(item_code);
  if (existing) {
    return res.status(400).json({ success: false, message: '事项编码已存在' });
  }
  
  try {
    const info = db.prepare(`
      INSERT INTO approval_items (item_code, item_name, template_id, applicant_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(item_code, item_name, template_id, applicant_id, remark || '');
    
    res.json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  const { approver, approval_result, remark } = req.body;
  const itemId = req.params.id;
  
  if (!approver) {
    return res.status(400).json({ success: false, message: '缺少审批人信息' });
  }
  
  const item = db.prepare('SELECT * FROM approval_items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: '审批事项不存在' });
  }
  if (item.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该事项已处理' });
  }
  
  db.prepare(`
    UPDATE approval_items 
    SET status = 'approved', approval_result = ?, approver = ?, approval_time = CURRENT_TIMESTAMP, remark = ?
    WHERE id = ?
  `).run(approval_result || '通过', approver, remark || item.remark, itemId);
  
  res.json({ success: true, message: '审批通过' });
});

router.post('/:id/reject', (req, res) => {
  const { approver, approval_result, remark } = req.body;
  const itemId = req.params.id;
  
  if (!approver) {
    return res.status(400).json({ success: false, message: '缺少审批人信息' });
  }
  
  const item = db.prepare('SELECT * FROM approval_items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: '审批事项不存在' });
  }
  if (item.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该事项已处理' });
  }
  
  db.prepare(`
    UPDATE approval_items 
    SET status = 'rejected', approval_result = ?, approver = ?, approval_time = CURRENT_TIMESTAMP, remark = ?
    WHERE id = ?
  `).run(approval_result || '驳回', approver, remark || item.remark, itemId);
  
  res.json({ success: true, message: '审批已驳回' });
});

module.exports = router;
