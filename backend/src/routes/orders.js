const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { student_id, status, type } = req.query;
  let query = `
    SELECT o.*, 
           c.name as course_name,
           u.name as student_name
    FROM orders o
    LEFT JOIN courses c ON o.course_id = c.id
    LEFT JOIN users u ON o.student_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'parent') {
    const children = db.prepare('SELECT id FROM users WHERE parent_id = ?').all(req.user.id);
    if (children.length > 0) {
      const ids = children.map(c => c.id).join(',');
      query += ` AND o.student_id IN (${ids})`;
    } else {
      return res.json([]);
    }
  }

  if (req.user.role === 'student') {
    query += ' AND o.student_id = ?';
    params.push(req.user.id);
  }

  if (student_id && (req.user.role === 'admin' || req.user.role === 'teacher')) {
    query += ' AND o.student_id = ?';
    params.push(student_id);
  }

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  if (type) {
    query += ' AND o.type = ?';
    params.push(type);
  }

  query += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.get('/:id', authenticateToken, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, 
           c.name as course_name,
           u.name as student_name
    FROM orders o
    LEFT JOIN courses c ON o.course_id = c.id
    LEFT JOIN users u ON o.student_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, order.student_id);
    if (!child) {
      return res.status(403).json({ error: '只能查看自己孩子的订单' });
    }
  }

  if (req.user.role === 'student' && order.student_id !== req.user.id) {
    return res.status(403).json({ error: '只能查看自己的订单' });
  }

  res.json(order);
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const { payment_method } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不允许支付' });
  }

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, order.student_id);
    if (!child) {
      return res.status(403).json({ error: '只能支付自己孩子的订单' });
    }
  }

  if (req.user.role === 'student' && order.student_id !== req.user.id) {
    return res.status(403).json({ error: '只能支付自己的订单' });
  }

  const success = Math.random() > 0.05;

  if (success) {
    db.prepare(`
      UPDATE orders 
      SET status = 'paid', payment_method = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(payment_method || 'online', `TXN${Date.now()}`, orderId);

    res.json({ message: '支付成功' });
  } else {
    db.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").run(orderId);
    res.status(400).json({ error: '支付失败，请重试' });
  }
});

router.post('/:id/audit', authenticateToken, requireRole('admin'), (req, res) => {
  const orderId = req.params.id;
  const { action, notes } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.type !== 'refund') {
    return res.status(400).json({ error: '只能审核退款订单' });
  }

  if (order.audit_status !== 'pending') {
    return res.status(400).json({ error: '订单已审核' });
  }

  if (action === 'approve') {
    const refundSuccess = Math.random() > 0.1;
    
    if (refundSuccess) {
      db.prepare(`
        UPDATE orders 
        SET audit_status = 'approved', auditor_id = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP,
            status = 'refunded', refunded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, notes || '', orderId);

      res.json({ message: '退款审核通过，已退款' });
    } else {
      db.prepare(`
        UPDATE orders 
        SET audit_status = 'rejected', auditor_id = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP,
            status = 'failed'
        WHERE id = ?
      `).run(req.user.id, notes || '退款处理失败', orderId);

      res.status(400).json({ error: '退款处理失败' });
    }
  } else {
    db.prepare(`
      UPDATE orders 
      SET audit_status = 'rejected', auditor_id = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP,
          status = 'cancelled'
      WHERE id = ?
    `).run(req.user.id, notes || '', orderId);

    res.json({ message: '退款已拒绝' });
  }
});

router.get('/reports/summary', authenticateToken, requireRole('admin'), (req, res) => {
  const { start_date, end_date } = req.query;

  let query = `
    SELECT 
      type,
      status,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM orders
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND date(created_at) >= date(?)';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date(created_at) <= date(?)';
    params.push(end_date);
  }

  query += ' GROUP BY type, status';

  const report = db.prepare(query).all(...params);
  res.json(report);
});

module.exports = router;
