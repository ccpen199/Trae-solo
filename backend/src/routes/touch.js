const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');

const touchSchema = Joi.object({
  customer_id: Joi.number().required(),
  product_id: Joi.number().optional(),
  segment_rule_id: Joi.number().optional(),
  channel: Joi.string().valid('短信', '电话', '站内信', 'APP推送').required(),
  result: Joi.string().valid('未接通', '客户拒绝', '待跟进', '已申请').required(),
  follow_up_status: Joi.string().valid('待处理', '处理中', '已完成').default('待处理'),
  operator: Joi.string().default('坐席'),
  remark: Joi.string().allow('').optional()
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, channel, result, follow_up_status, customer_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (channel) {
    whereClause += ' AND tr.channel = ?';
    params.push(channel);
  }
  if (result) {
    whereClause += ' AND tr.result = ?';
    params.push(result);
  }
  if (follow_up_status) {
    whereClause += ' AND tr.follow_up_status = ?';
    params.push(follow_up_status);
  }
  if (customer_id) {
    whereClause += ' AND tr.customer_id = ?';
    params.push(customer_id);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM touch_records tr ${whereClause}`;
  const total = db.prepare(countQuery).get(...params).total;
  
  let query = `
    SELECT tr.*, c.name, c.phone, c.card_no, p.name as product_name
    FROM touch_records tr
    LEFT JOIN customers c ON tr.customer_id = c.id
    LEFT JOIN installment_products p ON tr.product_id = p.id
    ${whereClause}
  `;
  
  query += ' ORDER BY tr.touch_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const records = db.prepare(query).all(...params);
  
  res.json({
    success: true,
    data: records,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.post('/', (req, res) => {
  const { error, value } = touchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(value.customer_id);
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO touch_records
    (customer_id, product_id, segment_rule_id, channel, result, follow_up_status, operator, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    value.customer_id,
    value.product_id,
    value.segment_rule_id,
    value.channel,
    value.result,
    value.follow_up_status,
    value.operator,
    value.remark
  );
  
  if (value.segment_rule_id && value.product_id) {
    db.prepare(`
      INSERT OR REPLACE INTO marketing_effects 
      (segment_rule_id, product_id, customer_id, touch_count, last_touch_at)
      VALUES (?, ?, ?, 
        COALESCE((SELECT touch_count FROM marketing_effects WHERE segment_rule_id = ? AND product_id = ? AND customer_id = ?), 0) + 1,
        CURRENT_TIMESTAMP
      )
    `).run(value.segment_rule_id, value.product_id, value.customer_id, value.segment_rule_id, value.product_id, value.customer_id);
  }
  
  res.json({ success: true, data: { id: result.lastInsertRowid, ...value } });
});

router.patch('/:id/follow-up', (req, res) => {
  const { follow_up_status, remark } = req.body;
  
  if (!follow_up_status) {
    return res.status(400).json({ success: false, message: '跟进状态必填' });
  }
  
  const result = db.prepare(`
    UPDATE touch_records SET follow_up_status = ?, remark = COALESCE(?, remark)
    WHERE id = ?
  `).run(follow_up_status, remark, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  
  res.json({ success: true, message: '跟进状态更新成功' });
});

router.get('/queue/:status', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const status = req.params.status;
  const offset = (page - 1) * pageSize;
  
  const count = db.prepare(`
    SELECT COUNT(*) as total FROM touch_records WHERE follow_up_status = ?
  `).get(status).total;
  
  const records = db.prepare(`
    SELECT tr.*, c.name, c.phone, c.card_level, c.bill_amount, p.name as product_name
    FROM touch_records tr
    JOIN customers c ON tr.customer_id = c.id
    LEFT JOIN installment_products p ON tr.product_id = p.id
    WHERE tr.follow_up_status = ?
    ORDER BY tr.touch_time ASC
    LIMIT ? OFFSET ?
  `).all(status, parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: records,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count
    }
  });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM touch_records WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
