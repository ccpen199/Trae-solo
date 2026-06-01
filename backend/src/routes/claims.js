const express = require('express');
const router = express.Router();
const db = require('../database');

function generateClaimNo() {
  const date = new Date();
  const prefix = 'C' + date.getFullYear().toString().slice(-2) + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

function generateOrderNo() {
  const date = new Date();
  const prefix = 'O' + date.getFullYear().toString().slice(-2) + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

router.get('/', (req, res) => {
  const { status, policy_no } = req.query;
  let sql = `
    SELECT c.*, p.policy_no, p.device_serial, p.device_model,
           wp.name as product_name, u.name as user_name, u.phone,
           so.id as order_id, so.status as order_status, sp.name as provider_name
    FROM claims c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN service_orders so ON c.id = so.claim_id
    LEFT JOIN service_providers sp ON so.provider_id = sp.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (policy_no) {
    sql += ' AND p.policy_no LIKE ?';
    params.push('%' + policy_no + '%');
  }
  sql += ' ORDER BY c.created_at DESC';
  
  const claims = db.prepare(sql).all(...params);
  res.json({ success: true, data: claims });
});

router.get('/:id', (req, res) => {
  const claim = db.prepare(`
    SELECT c.*, p.policy_no, p.device_serial, p.device_model, p.device_brand,
           p.start_date, p.end_date, p.service_count_used,
           wp.name as product_name, wp.coverage_scope, wp.max_service_count, wp.deductible,
           u.name as user_name, u.phone, u.address
    FROM claims c
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!claim) {
    return res.status(404).json({ success: false, message: '理赔申请不存在' });
  }
  
  const order = db.prepare(`
    SELECT so.*, sp.name as provider_name, sp.phone as provider_phone
    FROM service_orders so
    LEFT JOIN service_providers sp ON so.provider_id = sp.id
    WHERE so.claim_id = ?
  `).get(req.params.id);
  
  if (order) {
    order.parts = db.prepare('SELECT * FROM repair_parts WHERE order_id = ?').all(order.id);
    order.fees = db.prepare('SELECT * FROM repair_fees WHERE order_id = ?').all(order.id);
    claim.order = order;
  }
  
  res.json({ success: true, data: claim });
});

router.post('/', (req, res) => {
  const { policy_id, fault_type, fault_description } = req.body;
  
  const policy = db.prepare(`
    SELECT p.*, wp.max_service_count, wp.coverage_scope, wp.deductible
    FROM policies p
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    WHERE p.id = ?
  `).get(policy_id);
  
  if (!policy) {
    return res.status(400).json({ success: false, message: '保单不存在' });
  }
  
  if (policy.status !== 'active') {
    return res.status(400).json({ success: false, message: '保单状态无效，无法申请理赔' });
  }
  
  const now = new Date();
  const endDate = new Date(policy.end_date);
  if (now > endDate) {
    return res.status(400).json({ success: false, message: '保单已过期，无法申请理赔' });
  }
  
  if (policy.service_count_used >= policy.max_service_count) {
    return res.status(400).json({ success: false, message: '已达到最大服务次数限制' });
  }
  
  const claim_no = generateClaimNo();
  
  const info = db.prepare(`
    INSERT INTO claims (claim_no, policy_id, fault_type, fault_description, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(claim_no, policy_id, fault_type, fault_description);
  
  res.json({ success: true, data: { id: info.lastInsertRowid, claim_no } });
});

router.post('/:id/approve', (req, res) => {
  const { provider_id } = req.body;
  
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) {
    return res.status(404).json({ success: false, message: '理赔申请不存在' });
  }
  if (claim.status !== 'pending') {
    return res.status(400).json({ success: false, message: '只有待审核的申请可通过' });
  }
  
  db.prepare('UPDATE claims SET status = ? WHERE id = ?').run('approved', req.params.id);
  
  const order_no = generateOrderNo();
  db.prepare(`
    INSERT INTO service_orders (order_no, claim_id, provider_id, status)
    VALUES (?, ?, ?, 'assigned')
  `).run(order_no, req.params.id, provider_id || null);
  
  db.prepare('UPDATE policies SET service_count_used = service_count_used + 1 WHERE id = ?').run(claim.policy_id);
  
  res.json({ success: true, message: '理赔已通过，服务工单已生成' });
});

router.post('/:id/reject', (req, res) => {
  const { reject_reason, reject_clause } = req.body;
  
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) {
    return res.status(404).json({ success: false, message: '理赔申请不存在' });
  }
  if (claim.status !== 'pending') {
    return res.status(400).json({ success: false, message: '只有待审核的申请可拒赔' });
  }
  
  db.prepare(`
    UPDATE claims SET status = 'rejected', reject_reason = ?, reject_clause = ?
    WHERE id = ?
  `).run(reject_reason, reject_clause, req.params.id);
  
  res.json({ success: true, message: '拒赔处理完成' });
});

router.put('/order/:id/complete', (req, res) => {
  const { inspection_report, parts, fees, repair_date } = req.body;
  
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '服务工单不存在' });
  }
  
  db.prepare(`
    UPDATE service_orders 
    SET status = 'completed', inspection_report = ?, repair_date = ?
    WHERE id = ?
  `).run(inspection_report, repair_date || new Date().toISOString().split('T')[0], req.params.id);
  
  db.prepare('DELETE FROM repair_parts WHERE order_id = ?').run(req.params.id);
  if (parts && parts.length > 0) {
    const insertPart = db.prepare('INSERT INTO repair_parts (order_id, part_name, part_code, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)');
    parts.forEach(p => insertPart.run(req.params.id, p.part_name, p.part_code || '', p.quantity || 1, p.unit_price, p.total_price));
  }
  
  db.prepare('DELETE FROM repair_fees WHERE order_id = ?').run(req.params.id);
  if (fees && fees.length > 0) {
    const insertFee = db.prepare('INSERT INTO repair_fees (order_id, fee_type, amount, description) VALUES (?, ?, ?, ?)');
    fees.forEach(f => insertFee.run(req.params.id, f.fee_type, f.amount, f.description || ''));
  }
  
  res.json({ success: true, message: '维修结果已保存' });
});

router.post('/order/:id/confirm', (req, res) => {
  db.prepare('UPDATE service_orders SET user_confirmed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '用户已确认' });
});

router.post('/order/:id/settle', (req, res) => {
  db.prepare('UPDATE service_orders SET settled = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '已结算' });
});

module.exports = router;
