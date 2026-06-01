const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');
const moment = require('moment');

const productSchema = Joi.object({
  name: Joi.string().max(100).required(),
  periods: Joi.number().integer().min(1).required(),
  base_rate: Joi.number().min(0).required(),
  preferential_rate: Joi.number().min(0).optional(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  min_amount: Joi.number().min(0).default(1000),
  max_amount: Joi.number().min(0).default(500000),
  applicable_card_levels: Joi.array().items(Joi.string()).optional(),
  applicable_risk_levels: Joi.array().items(Joi.string()).optional(),
  created_by: Joi.string().default('系统')
});

router.get('/', (req, res) => {
  const { active_only } = req.query;
  let query = 'SELECT * FROM installment_products';
  const params = [];
  
  if (active_only === 'true') {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  const products = db.prepare(query).all(...params);
  products.forEach(p => {
    p.base_rate = p.base_rate * 100;
    if (p.preferential_rate) p.preferential_rate = p.preferential_rate * 100;
    if (p.applicable_card_levels) p.applicable_card_levels = JSON.parse(p.applicable_card_levels);
    if (p.applicable_risk_levels) p.applicable_risk_levels = JSON.parse(p.applicable_risk_levels);
  });
  
  res.json({ success: true, data: products });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM installment_products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  product.base_rate = product.base_rate * 100;
  if (product.preferential_rate) product.preferential_rate = product.preferential_rate * 100;
  if (product.applicable_card_levels) product.applicable_card_levels = JSON.parse(product.applicable_card_levels);
  if (product.applicable_risk_levels) product.applicable_risk_levels = JSON.parse(product.applicable_risk_levels);
  
  res.json({ success: true, data: product });
});

router.post('/calculate', (req, res) => {
  const { product_id, amount, customer_id } = req.body;
  
  if (!product_id || !amount) {
    return res.status(400).json({ success: false, message: '产品ID和金额必填' });
  }
  
  const product = db.prepare('SELECT * FROM installment_products WHERE id = ?').get(product_id);
  if (!product) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  
  const now = new Date();
  if (new Date(product.start_date) > now || new Date(product.end_date) < now) {
    return res.status(400).json({ success: false, message: '产品不在活动有效期内' });
  }
  
  if (amount < product.min_amount || amount > product.max_amount) {
    return res.status(400).json({ 
      success: false, 
      message: `金额必须在${product.min_amount} - ${product.max_amount}之间` 
    });
  }
  
  if (customer_id) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (customer) {
      const cardLevels = product.applicable_card_levels ? JSON.parse(product.applicable_card_levels) : null;
      const riskLevels = product.applicable_risk_levels ? JSON.parse(product.applicable_risk_levels) : null;
      
      if (cardLevels && !cardLevels.includes(customer.card_level)) {
        return res.status(400).json({ success: false, message: '该卡等级不适用此产品' });
      }
      if (riskLevels && !riskLevels.includes(customer.risk_level)) {
        return res.status(400).json({ success: false, message: '该风险等级不适用此产品' });
      }
    }
  }
  
  const rate = product.preferential_rate || product.base_rate;
  const monthly_fee = Number((amount * rate).toFixed(2));
  const monthly_principal = Number((amount / product.periods).toFixed(2));
  const monthly_payment = Number((monthly_principal + monthly_fee).toFixed(2));
  const total_fee = Number((monthly_fee * product.periods).toFixed(2));
  
  res.json({
    success: true,
    data: {
      amount,
      periods: product.periods,
      rate,
      monthly_payment,
      monthly_principal,
      monthly_fee,
      total_fee,
      total_repayment: Number((amount + total_fee).toFixed(2))
    }
  });
});

router.post('/', (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const stmt = db.prepare(`
    INSERT INTO installment_products
    (name, periods, base_rate, preferential_rate, start_date, end_date, min_amount, max_amount, applicable_card_levels, applicable_risk_levels, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    value.name,
    value.periods,
    value.base_rate / 100,
    value.preferential_rate ? value.preferential_rate / 100 : null,
    value.start_date,
    value.end_date,
    value.min_amount,
    value.max_amount,
    value.applicable_card_levels ? JSON.stringify(value.applicable_card_levels) : null,
    value.applicable_risk_levels ? JSON.stringify(value.applicable_risk_levels) : null,
    value.created_by
  );
  
  res.json({ success: true, data: { id: result.lastInsertRowid, ...value } });
});

router.put('/:id', (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const stmt = db.prepare(`
    UPDATE installment_products SET
      name = ?, periods = ?, base_rate = ?, preferential_rate = ?,
      start_date = ?, end_date = ?, min_amount = ?, max_amount = ?,
      applicable_card_levels = ?, applicable_risk_levels = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(
    value.name,
    value.periods,
    value.base_rate / 100,
    value.preferential_rate ? value.preferential_rate / 100 : null,
    value.start_date,
    value.end_date,
    value.min_amount,
    value.max_amount,
    value.applicable_card_levels ? JSON.stringify(value.applicable_card_levels) : null,
    value.applicable_risk_levels ? JSON.stringify(value.applicable_risk_levels) : null,
    req.params.id
  );
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  
  res.json({ success: true, message: '更新成功' });
});

router.patch('/:id/status', (req, res) => {
  const { is_active } = req.body;
  const result = db.prepare('UPDATE installment_products SET is_active = ? WHERE id = ?')
    .run(is_active ? 1 : 0, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  
  res.json({ success: true, message: '状态更新成功' });
});

module.exports = router;
