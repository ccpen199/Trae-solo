const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateOrderNo } = require('../utils/validation');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, owner_id, store_id, appointment_id, dispute_status } = req.query;
  let sql = `
    SELECT fo.*, a.order_no as appointment_order_no, p.name as pet_name,
           u.name as owner_name, u2.name as store_name
    FROM fee_orders fo
    LEFT JOIN appointments a ON fo.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN users u ON fo.owner_id = u.id
    LEFT JOIN users u2 ON fo.store_id = u2.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'owner') {
    sql += ' AND fo.owner_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'store' || req.user.role === 'staff') {
    sql += ' AND fo.store_id = ?';
    params.push(req.user.role === 'store' ? req.user.id : req.user.store_id);
  }
  
  if (status) {
    sql += ' AND fo.status = ?';
    params.push(status);
  }
  if (owner_id) {
    sql += ' AND fo.owner_id = ?';
    params.push(owner_id);
  }
  if (store_id) {
    sql += ' AND fo.store_id = ?';
    params.push(store_id);
  }
  if (appointment_id) {
    sql += ' AND fo.appointment_id = ?';
    params.push(appointment_id);
  }
  if (dispute_status) {
    sql += ' AND fo.dispute_status = ?';
    params.push(dispute_status);
  }
  
  sql += ' ORDER BY fo.created_at DESC';
  const orders = db.prepare(sql).all(...params);
  
  res.json(orders);
});

router.get('/:id', authenticateToken, (req, res) => {
  const fee = db.prepare(`
    SELECT fo.*, a.order_no as appointment_order_no, a.appointment_date, p.name as pet_name,
           s.name as service_name, u.name as owner_name, u.phone as owner_phone,
           u2.name as store_name
    FROM fee_orders fo
    LEFT JOIN appointments a ON fo.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN users u ON fo.owner_id = u.id
    LEFT JOIN users u2 ON fo.store_id = u2.id
    WHERE fo.id = ?
  `).get(req.params.id);
  
  if (!fee) {
    return res.status(404).json({ error: '费用单不存在' });
  }
  
  if (req.user.role === 'owner' && fee.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限访问此费用单' });
  }
  
  res.json(fee);
});

router.put('/:id/pay', authenticateToken, (req, res) => {
  const fee = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用单不存在' });
  }
  
  if (req.user.role === 'owner' && fee.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限支付此费用单' });
  }
  
  if (fee.status === 'paid') {
    return res.status(400).json({ error: '此费用单已支付' });
  }
  
  const { payment_method, paid_amount } = req.body;
  
  db.prepare(`
    UPDATE fee_orders SET status = 'paid', paid_amount = ?, payment_method = ?, 
    payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(paid_amount || fee.total_amount, payment_method || 'online', req.params.id);
  
  const updated = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/dispute', authenticateToken, requireRole('owner', 'customer_service', 'admin'), (req, res) => {
  const fee = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用单不存在' });
  }
  
  if (req.user.role === 'owner' && fee.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限对此费用单提出争议' });
  }
  
  const { dispute_reason } = req.body;
  
  if (!dispute_reason) {
    return res.status(400).json({ error: '争议原因不能为空' });
  }
  
  db.prepare(`
    UPDATE fee_orders SET dispute_reason = ?, dispute_status = 'pending', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(dispute_reason, req.params.id);
  
  const updated = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/resolve-dispute', authenticateToken, requireRole('customer_service', 'admin', 'store'), (req, res) => {
  const fee = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用单不存在' });
  }
  
  const { resolution, adjustment_amount } = req.body;
  
  if (!resolution) {
    return res.status(400).json({ error: '处理结果不能为空' });
  }
  
  const tx = db.transaction(() => {
    if (adjustment_amount) {
      db.prepare(`
        UPDATE fee_orders SET total_amount = total_amount + ?, extra_fee = extra_fee + ?,
        dispute_status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(adjustment_amount, adjustment_amount, req.params.id);
    } else {
      db.prepare(`
        UPDATE fee_orders SET dispute_status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.params.id);
    }
    
    const complaintNo = generateOrderNo('CMP');
    db.prepare(`
      INSERT INTO complaints (complaint_no, appointment_id, owner_id, store_id, complaint_type, 
      description, status, handler_id, handle_result, compensation_amount)
      VALUES (?, ?, ?, ?, 'fee_dispute', ?, 'resolved', ?, ?, ?)
    `).run(complaintNo, fee.appointment_id, fee.owner_id, fee.store_id, 
          fee.dispute_reason + '; 处理结果: ' + resolution, req.user.id, resolution, adjustment_amount || 0);
  });
  
  try {
    tx();
    const updated = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
    res.json({ fee_order: updated });
  } catch (err) {
    res.status(500).json({ error: '处理争议失败: ' + err.message });
  }
});

router.put('/:id/adjust', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  const fee = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  if (!fee) {
    return res.status(404).json({ error: '费用单不存在' });
  }
  
  const { extra_fee, extra_fee_reason, discount } = req.body;
  
  db.prepare(`
    UPDATE fee_orders SET extra_fee = extra_fee + ?, extra_fee_reason = COALESCE(extra_fee_reason, '') || ?, 
    discount = discount + ?, total_amount = service_fee + transport_fee + consumable_fee + extra_fee + ? - discount - ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(extra_fee || 0, extra_fee_reason ? '; ' + extra_fee_reason : '', discount || 0, 
        extra_fee || 0, discount || 0, req.params.id);
  
  const updated = db.prepare('SELECT * FROM fee_orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

module.exports = router;
