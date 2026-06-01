const express = require('express');
const router = express.Router();
const db = require('../database');

function generatePolicyNo() {
  const date = new Date();
  const prefix = 'W' + date.getFullYear().toString().slice(-2) + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

router.get('/', (req, res) => {
  const { status, user_phone, device_serial, policy_no } = req.query;
  let sql = `
    SELECT p.*, wp.name as product_name, wp.category, wp.duration_months, wp.coverage_scope,
           u.name as user_name, u.phone, s.name as store_name
    FROM policies p
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (user_phone) {
    sql += ' AND u.phone LIKE ?';
    params.push('%' + user_phone + '%');
  }
  if (device_serial) {
    sql += ' AND p.device_serial LIKE ?';
    params.push('%' + device_serial + '%');
  }
  if (policy_no) {
    sql += ' AND p.policy_no LIKE ?';
    params.push('%' + policy_no + '%');
  }
  sql += ' ORDER BY p.created_at DESC';
  
  const policies = db.prepare(sql).all(...params);
  res.json({ success: true, data: policies });
});

router.get('/:id', (req, res) => {
  const policy = db.prepare(`
    SELECT p.*, wp.name as product_name, wp.category, wp.duration_months, wp.coverage_scope, wp.max_service_count,
           u.name as user_name, u.phone, u.email, u.address,
           s.name as store_name
    FROM policies p
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!policy) {
    return res.status(404).json({ success: false, message: '保单不存在' });
  }
  
  const claims = db.prepare(`
    SELECT c.*, so.status as order_status
    FROM claims c
    LEFT JOIN service_orders so ON c.id = so.claim_id
    WHERE c.policy_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.id);
  
  policy.claims = claims;
  
  res.json({ success: true, data: policy });
});

router.post('/', (req, res) => {
  const { product_id, store_id, device_serial, device_model, device_brand, purchase_date, purchase_proof, channel, user_name, user_phone, user_email, user_address } = req.body;
  
  const existing = db.prepare('SELECT * FROM policies WHERE device_serial = ? AND status = ?').get(device_serial, 'active');
  if (existing) {
    return res.status(400).json({ success: false, message: '该设备已存在有效保单，不可重复投保' });
  }
  
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(user_phone);
  if (!user) {
    const userInfo = db.prepare('INSERT INTO users (name, phone, email, address) VALUES (?, ?, ?, ?)').run(user_name, user_phone, user_email || '', user_address || '');
    user = { id: userInfo.lastInsertRowid };
  }
  
  const product = db.prepare('SELECT * FROM warranty_products WHERE id = ?').get(product_id);
  if (!product) {
    return res.status(400).json({ success: false, message: '产品不存在' });
  }
  
  const start_date = purchase_date;
  const endDate = new Date(purchase_date);
  endDate.setMonth(endDate.getMonth() + product.duration_months);
  const end_date = endDate.toISOString().split('T')[0];
  
  const policy_no = generatePolicyNo();
  
  const info = db.prepare(`
    INSERT INTO policies (policy_no, product_id, user_id, store_id, device_serial, device_model, device_brand, purchase_date, purchase_proof, start_date, end_date, channel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(policy_no, product_id, user.id, store_id || null, device_serial, device_model || '', device_brand || '', purchase_date, purchase_proof || '', start_date, end_date, channel || '门店');
  
  res.json({ success: true, data: { id: info.lastInsertRowid, policy_no } });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE policies SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: '状态更新成功' });
});

module.exports = router;
