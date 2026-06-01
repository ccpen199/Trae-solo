const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { type, start_date, end_date } = req.query;
  let sql = `
    SELECT f.*, o.order_no
    FROM financial_records f
    LEFT JOIN orders o ON f.order_id = o.id
    WHERE 1=1
  `;
  const params = [];
  if (type) {
    sql += ' AND f.type = ?';
    params.push(type);
  }
  if (start_date) {
    sql += ' AND DATE(f.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(f.created_at) <= ?';
    params.push(end_date);
  }
  sql += ' ORDER BY f.id DESC';
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/summary', (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = 'SELECT type, SUM(amount) as total FROM financial_records WHERE 1=1';
  const params = [];
  if (start_date) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }
  sql += ' GROUP BY type';
  const summary = db.prepare(sql).all(...params);
  
  const totalIncome = summary.filter(s => ['rental', 'deposit', 'damage', 'violation', 'other_income'].includes(s.type))
    .reduce((sum, s) => sum + s.total, 0);
  const totalExpense = summary.filter(s => ['maintenance', 'refund', 'other_expense'].includes(s.type))
    .reduce((sum, s) => sum + s.total, 0);
  
  res.json({
    by_type: summary,
    total_income: totalIncome,
    total_expense: totalExpense,
    net_profit: totalIncome - totalExpense
  });
});

router.get('/:id', (req, res) => {
  const record = db.prepare(`
    SELECT f.*, o.order_no
    FROM financial_records f
    LEFT JOIN orders o ON f.order_id = o.id
    WHERE f.id = ?
  `).get(req.params.id);
  if (!record) return res.status(404).json({ error: '财务记录不存在' });
  res.json(record);
});

router.post('/', (req, res) => {
  const { order_id, type, amount, description, payment_method, transaction_no } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO financial_records (order_id, type, amount, description, payment_method, transaction_no)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(order_id || null, type, amount, description || '', payment_method || '', transaction_no || '');
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/pay', (req, res) => {
  const { payment_method, transaction_no } = req.body;
  try {
    db.prepare(`
      UPDATE financial_records 
      SET payment_method = ?, transaction_no = ?
      WHERE id = ? AND payment_method = 'pending'
    `).run(payment_method || 'cash', transaction_no || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM financial_records WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
