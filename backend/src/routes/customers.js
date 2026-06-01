const express = require('express');
const router = express.Router();
const { db } = require('../database');

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.substring(0, 4) + '********' + idCard.substring(idCard.length - 4);
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

function maskCustomerData(customer, role) {
  if (role !== 'admin') {
    if (customer.id_card) customer.id_card = maskIdCard(customer.id_card);
    if (customer.phone) customer.phone = maskPhone(customer.phone);
    if (customer.contact_phone) customer.contact_phone = maskPhone(customer.contact_phone);
  }
  return customer;
}

router.get('/', (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = 'SELECT * FROM customers';
  let countQuery = 'SELECT COUNT(*) as total FROM customers';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const customers = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  const maskedCustomers = customers.map(c => maskCustomerData({...c}, role));
  res.json({ data: maskedCustomers, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: '客户不存在' });
  res.json(maskCustomerData(customer, role));
});

router.post('/', (req, res) => {
  const { name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, total_fee, contact_person, contact_phone } = req.body;
  
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = db.prepare('SELECT COUNT(*) as cnt FROM customers WHERE customer_no LIKE ?').get(`CR${year}${month}%`).cnt;
  const customer_no = `CR${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  
  const result = db.prepare(`
    INSERT INTO customers (customer_no, name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, total_fee, contact_person, contact_phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(customer_no, name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, total_fee || 0, contact_person, contact_phone, 1);
  
  const materialTypes = {
    'overdue': ['身份证明', '结清证明', '异议说明', '沟通记录'],
    'misinformation': ['身份证明', '征信异议申请书', '证据材料', '沟通记录'],
    'unauthorized': ['身份证明', '报警回执', '非本人操作证明', '异议说明'],
    'other': ['身份证明', '情况说明', '相关证明材料']
  };
  
  const types = materialTypes[credit_problem_type] || materialTypes['other'];
  const insertMaterial = db.prepare('INSERT INTO materials (customer_id, material_type, material_name) VALUES (?, ?, ?)');
  types.forEach(type => {
    insertMaterial.run(result.lastInsertRowid, type, type);
  });
  
  db.prepare('INSERT INTO progress (customer_id, status, remark, operator_id) VALUES (?, ?, ?, ?)')
    .run(result.lastInsertRowid, '已签约', '客户档案已创建', 1);
  
  res.json({ id: result.lastInsertRowid, customer_no });
});

router.put('/:id', (req, res) => {
  const { name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, fee_status, total_fee, paid_fee, contact_person, contact_phone, status } = req.body;
  
  db.prepare(`
    UPDATE customers SET name = ?, id_card = ?, phone = ?, email = ?, credit_problem_type = ?, involved_institutions = ?, overdue_reason = ?, fee_status = ?, total_fee = ?, paid_fee = ?, contact_person = ?, contact_phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, id_card, phone, email, credit_problem_type, involved_institutions, overdue_reason, fee_status, total_fee, paid_fee, contact_person, contact_phone, status, req.params.id);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE customers SET status = ? WHERE id = ?').run('deleted', req.params.id);
  res.json({ success: true });
});

router.get('/:id/materials', (req, res) => {
  const materials = db.prepare('SELECT * FROM materials WHERE customer_id = ? ORDER BY submitted_at DESC').all(req.params.id);
  res.json(materials);
});

router.get('/:id/progress', (req, res) => {
  const progress = db.prepare('SELECT * FROM progress WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(progress);
});

router.get('/:id/result', (req, res) => {
  const result = db.prepare('SELECT * FROM results WHERE customer_id = ?').get(req.params.id);
  res.json(result || null);
});

module.exports = router;
