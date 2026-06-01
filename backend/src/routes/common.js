const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/suppliers', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(suppliers);
});

router.post('/suppliers', (req, res) => {
  const { name, contact, phone, address } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO suppliers (name, contact, phone, address)
      VALUES (?, ?, ?, ?)
    `).run(name, contact || '', phone || '', address || '');
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/cup-types', (req, res) => {
  const cupTypes = db.prepare('SELECT * FROM cup_types ORDER BY name').all();
  res.json(cupTypes);
});

router.post('/cup-types', (req, res) => {
  const { name, volume_ml, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO cup_types (name, volume_ml, description)
      VALUES (?, ?, ?)
    `).run(name, volume_ml, description || '');
    const cupType = db.prepare('SELECT * FROM cup_types WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cupType);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/brands', (req, res) => {
  const brands = db.prepare('SELECT * FROM liquor_brands ORDER BY name').all();
  res.json(brands);
});

router.post('/brands', (req, res) => {
  const { name, country, type } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO liquor_brands (name, country, type)
      VALUES (?, ?, ?)
    `).run(name, country || '', type || '');
    const brand = db.prepare('SELECT * FROM liquor_brands WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY name').all();
  res.json(users);
});

router.get('/stock-transactions', (req, res) => {
  const { liquor_id, start_date, end_date, transaction_type } = req.query;
  let sql = `
    SELECT st.*, l.name as liquor_name, u.name as creator_name
    FROM stock_transactions st
    LEFT JOIN liquors l ON st.liquor_id = l.id
    LEFT JOIN users u ON st.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (liquor_id) {
    sql += ' AND st.liquor_id = ?';
    params.push(liquor_id);
  }
  if (start_date) {
    sql += ' AND DATE(st.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(st.created_at) <= ?';
    params.push(end_date);
  }
  if (transaction_type) {
    sql += ' AND st.transaction_type = ?';
    params.push(transaction_type);
  }
  
  sql += ' ORDER BY st.created_at DESC';
  
  const transactions = db.prepare(sql).all(...params);
  res.json(transactions);
});

router.get('/approvals', (req, res) => {
  const { status, approval_type } = req.query;
  let sql = `
    SELECT a.*, u.name as requester_name, a2.name as approver_name
    FROM approvals a
    LEFT JOIN users u ON a.requested_by = u.id
    LEFT JOIN users a2 ON a.approved_by = a2.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (approval_type) {
    sql += ' AND a.approval_type = ?';
    params.push(approval_type);
  }
  
  sql += ' ORDER BY a.created_at DESC';
  
  const approvals = db.prepare(sql).all(...params);
  res.json(approvals);
});

router.get('/reports/profit', (req, res) => {
  const { start_date, end_date } = req.query;
  const start = start_date || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  const end = end_date || new Date().toISOString().split('T')[0];
  
  const summary = db.prepare(`
    SELECT
      DATE(created_at) as report_date,
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue,
      SUM(cost_amount) as total_cost,
      SUM(total_amount) - SUM(cost_amount) as gross_profit
    FROM sales
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY report_date
  `).all(start, end);
  
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      SUM(cost_amount) as total_cost,
      SUM(total_amount) - SUM(cost_amount) as gross_profit,
      (SUM(total_amount) - SUM(cost_amount)) / SUM(total_amount) * 100 as gross_margin
    FROM sales
    WHERE DATE(created_at) BETWEEN ? AND ?
  `).get(start, end);
  
  res.json({
    start_date: start,
    end_date: end,
    summary,
    totals
  });
});

module.exports = router;
