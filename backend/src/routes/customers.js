const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM customers';
  let countQuery = 'SELECT COUNT(*) as total FROM customers';
  const params = [];

  if (keyword) {
    query += ' WHERE name LIKE ? OR phone LIKE ?';
    countQuery += ' WHERE name LIKE ? OR phone LIKE ?';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  const customers = db.prepare(query).all(...params).map(c => ({
    ...c,
    is_child: Boolean(c.is_child),
    is_special: Boolean(c.is_special)
  }));
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({ data: customers, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  let customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  customer = {
    ...customer,
    is_child: Boolean(customer.is_child),
    is_special: Boolean(customer.is_special)
  };

  const optometryRecords = db.prepare(`
    SELECT * FROM optometry_records
    WHERE customer_id = ? AND is_current = 1
    ORDER BY created_at DESC
  `).all(req.params.id);

  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `).all(req.params.id);

  res.json({ ...customer, optometryRecords, orders });
});

router.post('/', (req, res) => {
  const { name, phone, gender, age, is_child, is_special, special_notes, frame_preference, health_tips } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: '姓名和手机号必填' });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '请输入正确的11位手机号码' });
  }

  const result = db.prepare(`
    INSERT INTO customers (name, phone, gender, age, is_child, is_special, special_notes, frame_preference, health_tips)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, phone, gender || null, age || null, is_child ? 1 : 0, is_special ? 1 : 0, special_notes || null, frame_preference || null, health_tips || null);

  let customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  customer = {
    ...customer,
    is_child: Boolean(customer.is_child),
    is_special: Boolean(customer.is_special)
  };
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const { name, phone, gender, age, is_child, is_special, special_notes, frame_preference, health_tips } = req.body;

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  if (phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '请输入正确的11位手机号码' });
    }
  }

  db.prepare(`
    UPDATE customers
    SET name = ?, phone = ?, gender = ?, age = ?, is_child = ?, is_special = ?, special_notes = ?, frame_preference = ?, health_tips = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || customer.name, phone || customer.phone, gender || customer.gender, age || customer.age, is_child ? 1 : 0, is_special ? 1 : 0, special_notes || customer.special_notes, frame_preference || customer.frame_preference, health_tips || customer.health_tips, req.params.id);

  let updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  updated = {
    ...updated,
    is_child: Boolean(updated.is_child),
    is_special: Boolean(updated.is_special)
  };
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
