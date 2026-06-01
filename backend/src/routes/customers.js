const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword, level, region, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (keyword) {
    whereClause += ' AND (name LIKE ? OR customer_no LIKE ? OR contact_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (level) {
    whereClause += ' AND level = ?';
    params.push(level);
  }
  
  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }
  
  if (status !== undefined) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const customers = db.prepare(`
    SELECT * FROM customers ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM customers ${whereClause}`).get(...params).count;
  
  res.json({ list: customers, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  const behaviors = db.prepare(`
    SELECT * FROM customer_behavior 
    WHERE customer_id = ? 
    ORDER BY behavior_time DESC 
    LIMIT 50
  `).all(req.params.id);
  
  const payments = db.prepare(`
    SELECT * FROM payment_records 
    WHERE customer_id = ? 
    ORDER BY payment_time DESC 
    LIMIT 20
  `).all(req.params.id);
  
  const assessments = db.prepare(`
    SELECT ra.*, u.name as reviewer_name
    FROM risk_assessments ra
    LEFT JOIN users u ON ra.reviewer_id = u.id
    WHERE ra.customer_id = ? 
    ORDER BY ra.assessment_time DESC 
    LIMIT 10
  `).all(req.params.id);
  
  const tasks = db.prepare(`
    SELECT rt.*, u.name as assignee_name
    FROM recovery_tasks rt
    LEFT JOIN users u ON rt.assignee_id = u.id
    WHERE rt.customer_id = ? 
    ORDER BY rt.created_at DESC 
    LIMIT 10
  `).all(req.params.id);
  
  res.json({ customer, behaviors, payments, assessments, tasks });
});

router.post('/', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { customer_no, name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount, expiration_date } = req.body;
  
  if (!customer_no || !name) {
    return res.status(400).json({ error: '客户编号和名称不能为空' });
  }
  
  const existing = db.prepare('SELECT id FROM customers WHERE customer_no = ?').get(customer_no);
  if (existing) {
    return res.status(400).json({ error: '客户编号已存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO customers (customer_no, name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount, expiration_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(customer_no, name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount || 0, expiration_date);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount, expiration_date, status } = req.body;
  
  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  db.prepare(`
    UPDATE customers 
    SET name = ?, company = ?, industry = ?, level = ?, contact_name = ?, contact_phone = ?, contact_email = ?, 
        region = ?, total_amount = ?, expiration_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount, expiration_date, status, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', roleMiddleware(['admin']), (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
