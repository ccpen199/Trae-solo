const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');
const moment = require('moment');

const applicationSchema = Joi.object({
  customer_id: Joi.number().required(),
  product_id: Joi.number().required(),
  amount: Joi.number().min(0).required(),
  segment_rule_id: Joi.number().optional()
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, customer_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }
  if (customer_id) {
    whereClause += ' AND a.customer_id = ?';
    params.push(customer_id);
  }
  
  const countQuery = `SELECT COUNT(*) as total FROM installment_applications a ${whereClause}`;
  const total = db.prepare(countQuery).get(...params).total;
  
  let query = `
    SELECT a.*, c.name, c.phone, c.card_no, c.card_level, c.risk_level,
           p.name as product_name, p.periods
    FROM installment_applications a
    JOIN customers c ON a.customer_id = c.id
    JOIN installment_products p ON a.product_id = p.id
    ${whereClause}
  `;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const applications = db.prepare(query).all(...params);
  
  res.json({
    success: true,
    data: applications,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', (req, res) => {
  const application = db.prepare(`
    SELECT a.*, c.name, c.phone, c.card_no, c.available_limit,
           p.name as product_name, p.periods
    FROM installment_applications a
    JOIN customers c ON a.customer_id = c.id
    JOIN installment_products p ON a.product_id = p.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!application) {
    return res.status(404).json({ success: false, message: '申请不存在' });
  }
  
  const plans = db.prepare('SELECT * FROM repayment_plans WHERE application_id = ? ORDER BY period_no').all(req.params.id);
  application.repayment_plans = plans;
  
  res.json({ success: true, data: application });
});

router.post('/', (req, res) => {
  const { error, value } = applicationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(value.customer_id);
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  
  const product = db.prepare('SELECT * FROM installment_products WHERE id = ?').get(value.product_id);
  if (!product) {
    return res.status(404).json({ success: false, message: '产品不存在' });
  }
  
  const now = new Date();
  if (new Date(product.start_date) > now || new Date(product.end_date) < now) {
    return res.status(400).json({ success: false, message: '产品不在活动有效期内' });
  }
  
  if (value.amount < product.min_amount || value.amount > product.max_amount) {
    return res.status(400).json({ 
      success: false, 
      message: `金额必须在${product.min_amount} - ${product.max_amount}之间` 
    });
  }
  
  if (value.amount > customer.available_limit) {
    return res.status(400).json({ success: false, message: '超出可用额度' });
  }
  
  const pendingApp = db.prepare(`
    SELECT COUNT(*) as count FROM installment_applications 
    WHERE customer_id = ? AND status = '待审批'
  `).get(value.customer_id);
  
  if (pendingApp.count > 0) {
    return res.status(400).json({ success: false, message: '已有待审批申请' });
  }
  
  const rate = product.preferential_rate || product.base_rate;
  const monthly_fee = value.amount * rate;
  const monthly_principal = value.amount / product.periods;
  const monthly_payment = Number((monthly_principal + monthly_fee).toFixed(2));
  const total_fee = Number((monthly_fee * product.periods).toFixed(2));
  
  const application_no = 'INS' + Date.now().toString().slice(-10);
  
  const stmt = db.prepare(`
    INSERT INTO installment_applications
    (application_no, customer_id, product_id, amount, periods, monthly_payment, total_fee, applied_rate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待审批')
  `);
  
  const result = stmt.run(
    application_no,
    value.customer_id,
    value.product_id,
    value.amount,
    product.periods,
    monthly_payment,
    total_fee,
    rate
  );
  
  if (value.segment_rule_id) {
    db.prepare(`
      INSERT OR REPLACE INTO marketing_effects 
      (segment_rule_id, product_id, customer_id, application_count, last_application_at)
      VALUES (?, ?, ?, 
        COALESCE((SELECT application_count FROM marketing_effects WHERE segment_rule_id = ? AND product_id = ? AND customer_id = ?), 0) + 1,
        CURRENT_TIMESTAMP
      )
    `).run(value.segment_rule_id, value.product_id, value.customer_id, value.segment_rule_id, value.product_id, value.customer_id);
  }
  
  res.json({ 
    success: true, 
    data: { 
      id: result.lastInsertRowid, 
      application_no,
      monthly_payment,
      total_fee,
      rate
    } 
  });
});

router.patch('/:id/approve', (req, res) => {
  const { approved, review_remark, reviewed_by = '审批员', segment_rule_id } = req.body;
  
  const application = db.prepare('SELECT * FROM installment_applications WHERE id = ?').get(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: '申请不存在' });
  }
  
  if (application.status !== '待审批') {
    return res.status(400).json({ success: false, message: '申请状态非待审批' });
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(application.customer_id);
  
  if (!approved) {
    db.prepare(`
      UPDATE installment_applications 
      SET status = '已拒绝', risk_review_result = '拒绝', review_remark = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(review_remark || '风控拒绝', reviewed_by, req.params.id);
    
    return res.json({ success: true, message: '申请已拒绝' });
  }
  
  if (customer.risk_level === '高') {
    return res.status(400).json({ success: false, message: '高风险客户不能通过审批' });
  }
  
  db.transaction(() => {
    db.prepare(`
      UPDATE installment_applications 
      SET status = '已通过', risk_review_result = '通过', review_remark = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(review_remark || '审核通过', reviewed_by, req.params.id);
    
    db.prepare(`
      UPDATE customers 
      SET available_limit = available_limit - ?, installment_history_count = installment_history_count + 1
      WHERE id = ?
    `).run(application.amount, application.customer_id);
    
    const insertPlan = db.prepare(`
      INSERT INTO repayment_plans (application_id, period_no, due_date, principal, fee, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, '待还款')
    `);
    
    const monthly_principal = Number((application.amount / application.periods).toFixed(2));
    const monthly_fee = Number((application.amount * application.applied_rate).toFixed(2));
    
    for (let i = 1; i <= application.periods; i++) {
      const due_date = moment().add(i, 'months').format('YYYY-MM-DD');
      const total = Number((monthly_principal + monthly_fee).toFixed(2));
      insertPlan.run(req.params.id, i, due_date, monthly_principal, monthly_fee, total);
    }
    
    if (segment_rule_id) {
      db.prepare(`
        INSERT OR REPLACE INTO marketing_effects 
        (segment_rule_id, product_id, customer_id, approved_count, total_approved_amount)
        VALUES (?, ?, ?, 
          COALESCE((SELECT approved_count FROM marketing_effects WHERE segment_rule_id = ? AND product_id = ? AND customer_id = ?), 0) + 1,
          COALESCE((SELECT total_approved_amount FROM marketing_effects WHERE segment_rule_id = ? AND product_id = ? AND customer_id = ?), 0) + ?
        )
      `).run(segment_rule_id, application.product_id, application.customer_id, 
              segment_rule_id, application.product_id, application.customer_id,
              segment_rule_id, application.product_id, application.customer_id, application.amount);
    }
  })();
  
  res.json({ success: true, message: '审批通过，还款计划已生成' });
});

module.exports = router;
