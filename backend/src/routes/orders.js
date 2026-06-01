const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { auditMiddleware } = require('../middleware/audit');

const router = express.Router();
router.use(auditMiddleware('orders'));

const orderItemSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  product_name: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  unit_price: Joi.number().min(0).required(),
  subtotal: Joi.number().min(0).required()
});

const orderSchema = Joi.object({
  farmer_id: Joi.number().integer().required(),
  store_id: Joi.number().integer().required(),
  credit_approval_id: Joi.number().integer().required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  total_amount: Joi.number().min(0).required(),
  account_period_days: Joi.number().integer().min(0).required(),
  due_date: Joi.string().required(),
  notes: Joi.string().allow('')
});

function generateOrderNo() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${dateStr}${random}`;
}

function generateRepaymentNo() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REP${dateStr}${random}`;
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, farmer_id, store_id, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];
  
  if (farmer_id) {
    whereClause += ' AND o.farmer_id = ?';
    params.push(farmer_id);
  }
  
  if (store_id) {
    whereClause += ' AND o.store_id = ?';
    params.push(store_id);
  }
  
  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }
  
  const orders = db.prepare(`
    SELECT o.*, f.name as farmer_name, s.name as store_name
    FROM orders o
    LEFT JOIN farmers f ON o.farmer_id = f.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE ${whereClause}
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE ${whereClause}`).get(...params).count;
  
  res.json({ success: true, data: orders, total });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, f.name as farmer_name, s.name as store_name,
           ca.approved_amount as credit_approved_amount, ca.available_amount as credit_available_amount
    FROM orders o
    LEFT JOIN farmers f ON o.farmer_id = f.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN credit_approvals ca ON o.credit_approval_id = ca.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  const repayment = db.prepare('SELECT * FROM repayments WHERE order_id = ?').get(req.params.id);
  
  res.json({ success: true, data: { ...order, items, repayment } });
});

router.post('/', (req, res) => {
  const { error, value } = orderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  
  const credit = db.prepare('SELECT * FROM credit_approvals WHERE id = ?').get(value.credit_approval_id);
  if (!credit) {
    return res.status(400).json({ success: false, message: '授信记录不存在' });
  }
  
  if (credit.approval_status !== 'approved') {
    return res.status(400).json({ success: false, message: '该授信未通过审批' });
  }
  
  if (credit.available_amount < value.total_amount) {
    return res.status(400).json({ 
      success: false, 
      message: `授信额度不足，可用额度: ${credit.available_amount}元，订单金额: ${value.total_amount}元` 
    });
  }
  
  const now = new Date();
  const validityStart = new Date(credit.validity_start);
  const validityEnd = new Date(credit.validity_end);
  
  if (now < validityStart || now > validityEnd) {
    return res.status(400).json({ success: false, message: '授信不在有效期内' });
  }
  
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(value.farmer_id);
  if (!farmer || farmer.status !== 'active') {
    return res.status(400).json({ success: false, message: '农户不存在或已停用' });
  }
  
  const tx = db.transaction(() => {
    const orderNo = generateOrderNo();
    
    const orderStmt = db.prepare(`
      INSERT INTO orders (order_no, farmer_id, store_id, credit_approval_id, total_amount,
        account_period_days, due_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);
    
    const orderResult = orderStmt.run(
      orderNo, value.farmer_id, value.store_id, value.credit_approval_id,
      value.total_amount, value.account_period_days, value.due_date, value.notes
    );
    
    const orderId = orderResult.lastInsertRowid;
    
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of value.items) {
      itemStmt.run(orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal);
    }
    
    db.prepare(`
      UPDATE credit_approvals SET
        used_amount = used_amount + ?,
        available_amount = available_amount - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(value.total_amount, value.total_amount, value.credit_approval_id);
    
    const repaymentNo = generateRepaymentNo();
    db.prepare(`
      INSERT INTO repayments (repayment_no, order_id, farmer_id, total_amount, paid_amount,
        remaining_amount, due_date, status, is_overdue, overdue_days)
      VALUES (?, ?, ?, ?, 0, ?, ?, 'pending', 0, 0)
    `).run(repaymentNo, orderId, value.farmer_id, value.total_amount, value.total_amount, value.due_date);
    
    req.audit(orderId, 'create', null, { ...value, order_no: orderNo });
    
    return orderId;
  });
  
  try {
    const orderId = tx();
    res.json({ success: true, data: { id: orderId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/sign', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  if (order.signed_by_farmer) {
    return res.status(400).json({ success: false, message: '订单已签收' });
  }
  
  db.prepare(`
    UPDATE orders SET
      signed_by_farmer = 1,
      signed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  req.audit(req.params.id, 'sign', order, { ...order, signed_by_farmer: 1 });
  
  res.json({ success: true, message: '签收成功' });
});

router.put('/:id/cancel', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  if (order.status === 'completed' || order.status === 'cancelled') {
    return res.status(400).json({ success: false, message: '订单已完成或已取消' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE orders SET
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    
    db.prepare(`
      UPDATE credit_approvals SET
        used_amount = used_amount - ?,
        available_amount = available_amount + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.total_amount, order.total_amount, order.credit_approval_id);
    
    db.prepare(`
      UPDATE repayments SET
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).run(req.params.id);
    
    req.audit(req.params.id, 'cancel', order, { ...order, status: 'cancelled' });
  });
  
  try {
    tx();
    res.json({ success: true, message: '取消成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
