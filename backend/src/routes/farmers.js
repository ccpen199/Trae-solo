const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(auditMiddleware('farmers'));

const farmerSchema = Joi.object({
  name: Joi.string().required(),
  id_card: Joi.string().length(18).required(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  address: Joi.string().allow(''),
  planting_area: Joi.number().min(0).default(0),
  historical_yield: Joi.number().min(0).default(0),
  cooperative_id: Joi.number().integer().allow(null),
  has_cooperative_guarantee: Joi.number().valid(0, 1).default(0),
  guarantee_amount: Joi.number().min(0).default(0),
  past_repayment_history: Joi.string().allow(''),
  insurance_info: Joi.string().allow(''),
  subsidy_info: Joi.string().allow(''),
  risk_tags: Joi.string().allow(''),
  credit_score: Joi.number().min(300).max(900).default(600),
  status: Joi.string().valid('active', 'inactive').default('active')
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (keyword) {
    whereClause += ' AND (name LIKE ? OR id_card LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const farmers = db.prepare(`
    SELECT f.*, c.name as cooperative_name
    FROM farmers f
    LEFT JOIN cooperatives c ON f.cooperative_id = c.id
    WHERE ${whereClause}
    ORDER BY f.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM farmers WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: farmers, total });
});

router.get('/:id', (req, res) => {
  const farmer = db.prepare(`
    SELECT f.*, c.name as cooperative_name
    FROM farmers f
    LEFT JOIN cooperatives c ON f.cooperative_id = c.id
    WHERE f.id = ?
  `).get(req.params.id);
  
  if (!farmer) {
    return res.status(404).json({ success: false, message: '农户不存在' });
  }
  
  const credits = db.prepare('SELECT * FROM credit_approvals WHERE farmer_id = ? ORDER BY id DESC').all(req.params.id);
  const orders = db.prepare('SELECT * FROM orders WHERE farmer_id = ? ORDER BY id DESC').all(req.params.id);
  const repayments = db.prepare('SELECT * FROM repayments WHERE farmer_id = ? ORDER BY id DESC').all(req.params.id);
  
  res.json({ success: true, data: { ...farmer, credits, orders, repayments } });
});

router.post('/', (req, res) => {
  const { error, value } = farmerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const existing = db.prepare('SELECT id FROM farmers WHERE id_card = ?').get(value.id_card);
  if (existing) {
    return res.status(400).json({ success: false, message: '身份证号已存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO farmers (name, id_card, phone, address, planting_area, historical_yield,
      cooperative_id, has_cooperative_guarantee, guarantee_amount, past_repayment_history,
      insurance_info, subsidy_info, risk_tags, credit_score, status)
    VALUES (@name, @id_card, @phone, @address, @planting_area, @historical_yield,
      @cooperative_id, @has_cooperative_guarantee, @guarantee_amount, @past_repayment_history,
      @insurance_info, @subsidy_info, @risk_tags, @credit_score, @status)
  `);
  
  const result = stmt.run(value);
  req.audit(result.lastInsertRowid, 'create', null, value);
  
  res.json({ success: true, data: { id: result.lastInsertRowid, ...value } });
});

router.put('/:id', (req, res) => {
  const oldFarmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!oldFarmer) {
    return res.status(404).json({ success: false, message: '农户不存在' });
  }
  
  const { error, value } = farmerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const existing = db.prepare('SELECT id FROM farmers WHERE id_card = ? AND id != ?').get(value.id_card, req.params.id);
  if (existing) {
    return res.status(400).json({ success: false, message: '身份证号已存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE farmers SET
      name = @name, id_card = @id_card, phone = @phone, address = @address,
      planting_area = @planting_area, historical_yield = @historical_yield,
      cooperative_id = @cooperative_id, has_cooperative_guarantee = @has_cooperative_guarantee,
      guarantee_amount = @guarantee_amount, past_repayment_history = @past_repayment_history,
      insurance_info = @insurance_info, subsidy_info = @subsidy_info,
      risk_tags = @risk_tags, credit_score = @credit_score, status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${req.params.id}
  `);
  
  stmt.run(value);
  req.audit(req.params.id, 'update', oldFarmer, value);
  
  res.json({ success: true, message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const oldFarmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!oldFarmer) {
    return res.status(404).json({ success: false, message: '农户不存在' });
  }
  
  const hasOrders = db.prepare('SELECT 1 FROM orders WHERE farmer_id = ? LIMIT 1').get(req.params.id);
  if (hasOrders) {
    return res.status(400).json({ success: false, message: '该农户有相关订单，无法删除' });
  }
  
  db.prepare('DELETE FROM farmers WHERE id = ?').run(req.params.id);
  req.audit(req.params.id, 'delete', oldFarmer, null);
  
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
