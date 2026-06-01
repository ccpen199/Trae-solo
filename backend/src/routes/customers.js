const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');

const customerSchema = Joi.object({
  card_no: Joi.string().length(16).required(),
  name: Joi.string().max(50).required(),
  phone: Joi.string().length(11).required(),
  card_level: Joi.string().valid('普通', '金卡', '白金', '钻石').default('普通'),
  credit_limit: Joi.number().min(0).default(10000),
  available_limit: Joi.number().min(0).default(10000),
  bill_amount: Joi.number().min(0).default(0),
  overdue_days: Joi.number().min(0).default(0),
  risk_level: Joi.string().valid('低', '中', '高').default('低'),
  consumption_industries: Joi.string().allow(''),
  installment_history_count: Joi.number().min(0).default(0),
  is_excluded: Joi.boolean().default(false)
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, card_level, risk_level, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  
  if (card_level) {
    query += ' AND card_level = ?';
    params.push(card_level);
  }
  if (risk_level) {
    query += ' AND risk_level = ?';
    params.push(risk_level);
  }
  if (keyword) {
    query += ' AND (name LIKE ? OR card_no LIKE ? OR phone LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
  }
  
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countQuery).get(...params).total;
  
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const customers = db.prepare(query).all(...params);
  
  res.json({
    success: true,
    data: customers,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  res.json({ success: true, data: customer });
});

router.post('/', (req, res) => {
  const { error, value } = customerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO customers 
      (card_no, name, phone, card_level, credit_limit, available_limit, bill_amount, overdue_days, risk_level, consumption_industries, installment_history_count, is_excluded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      value.card_no,
      value.name,
      value.phone,
      value.card_level,
      value.credit_limit,
      value.available_limit,
      value.bill_amount,
      value.overdue_days,
      value.risk_level,
      value.consumption_industries,
      value.installment_history_count,
      value.is_excluded ? 1 : 0
    );
    res.json({ success: true, data: { id: result.lastInsertRowid, ...value } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: '卡号已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { error, value } = customerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const stmt = db.prepare(`
    UPDATE customers SET
      card_no = ?, name = ?, phone = ?, card_level = ?, credit_limit = ?,
      available_limit = ?, bill_amount = ?, overdue_days = ?, risk_level = ?,
      consumption_industries = ?, installment_history_count = ?, is_excluded = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(
    value.card_no,
    value.name,
    value.phone,
    value.card_level,
    value.credit_limit,
    value.available_limit,
    value.bill_amount,
    value.overdue_days,
    value.risk_level,
    value.consumption_industries,
    value.installment_history_count,
    value.is_excluded ? 1 : 0,
    req.params.id
  );
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  
  res.json({ success: true, message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
