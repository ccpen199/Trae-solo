const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(auditMiddleware('repayments'));

const repaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().valid('现金', '银行转账', '微信', '支付宝').required(),
  payment_date: Joi.string().required(),
  operator: Joi.string().allow(''),
  notes: Joi.string().allow('')
});

const extensionSchema = Joi.object({
  extension_days: Joi.number().integer().min(1).required(),
  extension_reason: Joi.string().required()
});

const reductionSchema = Joi.object({
  reduction_amount: Joi.number().min(0).required(),
  reduction_reason: Joi.string().required()
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, farmer_id, status, is_overdue } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (farmer_id) {
    whereClause += ' AND r.farmer_id = ?';
    params.push(farmer_id);
  }
  
  if (status) {
    whereClause += ' AND r.status = ?';
    params.push(status);
  }
  
  if (is_overdue !== undefined) {
    whereClause += ' AND r.is_overdue = ?';
    params.push(is_overdue);
  }
  
  const repayments = db.prepare(`
    SELECT r.*, f.name as farmer_name, o.order_no
    FROM repayments r
    LEFT JOIN farmers f ON r.farmer_id = f.id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE ${whereClause}
    ORDER BY r.due_date ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM repayments r WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: repayments, total });
});

router.get('/:id', (req, res) => {
  const repayment = db.prepare(`
    SELECT r.*, f.name as farmer_name, f.phone as farmer_phone,
           o.order_no, o.total_amount as order_amount, s.name as store_name
    FROM repayments r
    LEFT JOIN farmers f ON r.farmer_id = f.id
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!repayment) {
    return res.status(404).json({ success: false, message: '还款记录不存在' });
  }
  
  const records = db.prepare('SELECT * FROM repayment_records WHERE repayment_id = ? ORDER BY id DESC').all(req.params.id);
  
  res.json({ success: true, data: { ...repayment, records } });
});

router.post('/:id/pay', (req, res) => {
  const { error, value } = repaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(req.params.id);
  if (!repayment) {
    return res.status(404).json({ success: false, message: '还款记录不存在' });
  }
  
  if (repayment.status === 'paid' || repayment.status === 'cancelled') {
    return res.status(400).json({ success: false, message: '该还款已结清或已取消' });
  }
  
  if (value.amount > repayment.remaining_amount) {
    return res.status(400).json({ 
      success: false, 
      message: `还款金额不能超过剩余待还金额: ${repayment.remaining_amount}元` 
    });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO repayment_records (repayment_id, amount, payment_method, payment_date, operator, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, value.amount, value.payment_method, value.payment_date, value.operator, value.notes);
    
    const newPaidAmount = repayment.paid_amount + value.amount;
    const newRemainingAmount = repayment.remaining_amount - value.amount;
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';
    const actualPaidDate = newRemainingAmount <= 0 ? value.payment_date : null;
    
    db.prepare(`
      UPDATE repayments SET
        paid_amount = ?,
        remaining_amount = ?,
        status = ?,
        actual_paid_date = COALESCE(?, actual_paid_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPaidAmount, newRemainingAmount, newStatus, actualPaidDate, req.params.id);
    
    if (newStatus === 'paid') {
      db.prepare(`
        UPDATE orders SET
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(repayment.order_id);
    }
    
    req.audit(req.params.id, 'pay', repayment, { 
      ...repayment, 
      paid_amount: newPaidAmount, 
      remaining_amount: newRemainingAmount,
      status: newStatus 
    });
  });
  
  try {
    tx();
    res.json({ success: true, message: '还款成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/extend', (req, res) => {
  const { error, value } = extensionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(req.params.id);
  if (!repayment) {
    return res.status(404).json({ success: false, message: '还款记录不存在' });
  }
  
  if (repayment.status === 'paid' || repayment.status === 'cancelled') {
    return res.status(400).json({ success: false, message: '该还款已结清或已取消' });
  }
  
  const tx = db.transaction(() => {
    const oldDueDate = new Date(repayment.due_date);
    oldDueDate.setDate(oldDueDate.getDate() + value.extension_days);
    const newDueDate = oldDueDate.toISOString().split('T')[0];
    
    db.prepare(`
      UPDATE repayments SET
        due_date = ?,
        extension_days = extension_days + ?,
        extension_reason = ?,
        is_overdue = 0,
        overdue_days = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newDueDate, value.extension_days, value.extension_reason, req.params.id);
    
    req.audit(req.params.id, 'extend', repayment, { 
      ...repayment, 
      due_date: newDueDate,
      extension_days: repayment.extension_days + value.extension_days
    });
  });
  
  try {
    tx();
    res.json({ success: true, message: '展期成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/reduce', (req, res) => {
  const { error, value } = reductionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(req.params.id);
  if (!repayment) {
    return res.status(404).json({ success: false, message: '还款记录不存在' });
  }
  
  if (repayment.status === 'paid' || repayment.status === 'cancelled') {
    return res.status(400).json({ success: false, message: '该还款已结清或已取消' });
  }
  
  if (value.reduction_amount > repayment.remaining_amount) {
    return res.status(400).json({ 
      success: false, 
      message: `减免金额不能超过剩余待还金额: ${repayment.remaining_amount}元` 
    });
  }
  
  const tx = db.transaction(() => {
    const newReductionAmount = repayment.reduction_amount + value.reduction_amount;
    const newRemainingAmount = repayment.remaining_amount - value.reduction_amount;
    const newTotalAmount = repayment.total_amount - value.reduction_amount;
    const newStatus = newRemainingAmount <= 0 ? 'paid' : repayment.status;
    
    db.prepare(`
      UPDATE repayments SET
        total_amount = ?,
        remaining_amount = ?,
        reduction_amount = ?,
        reduction_reason = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newTotalAmount, newRemainingAmount, newReductionAmount, value.reduction_reason, newStatus, req.params.id);
    
    req.audit(req.params.id, 'reduce', repayment, { 
      ...repayment, 
      total_amount: newTotalAmount,
      remaining_amount: newRemainingAmount,
      reduction_amount: newReductionAmount
    });
  });
  
  try {
    tx();
    res.json({ success: true, message: '减免成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/check-overdue', (req, res) => {
  const tx = db.transaction(() => {
    const overdueRepayments = db.prepare(`
      UPDATE repayments SET
        is_overdue = 1,
        overdue_days = CAST((julianday('now') - julianday(due_date)) AS INTEGER),
        status = 'overdue',
        updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('pending', 'partial')
        AND DATE(due_date) < DATE('now')
        AND is_overdue = 0
    `).run();
    
    db.prepare(`
      UPDATE repayments SET
        overdue_days = CAST((julianday('now') - julianday(due_date)) AS INTEGER),
        updated_at = CURRENT_TIMESTAMP
      WHERE is_overdue = 1
    `).run();
    
    return overdueRepayments.changes;
  });
  
  try {
    const count = tx();
    res.json({ success: true, message: `检测到 ${count} 笔新逾期账单` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
