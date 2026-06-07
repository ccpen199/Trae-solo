const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/items', (req, res) => {
  const db = getDB();
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM payment_items WHERE category = ? AND status = ?').all(category, 'active');
  } else {
    rows = db.prepare('SELECT * FROM payment_items WHERE status = ?').all('active');
  }
  res.json({ data: rows });
});

router.get('/orders', (req, res) => {
  const db = getDB();
  const { status, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND o.status = ?'; params.push(status); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM payment_orders o WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT o.*, p.name as item_name, p.category FROM payment_orders o LEFT JOIN payment_items p ON o.item_id = p.id WHERE ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/pay', (req, res) => {
  const db = getDB();
  const { user_id_card, item_id, category, item_name, account_no, pay_type, payee_code, payee_name, payable_amount, amount, auto_debit, remark } = req.body;
  const order_no = `PAY-${new Date().getFullYear()}-${String(db.prepare('SELECT COUNT(*) as cnt FROM payment_orders').get().cnt + 1).padStart(5, '0')}`;
  db.prepare(`INSERT INTO payment_orders (order_no, user_id_card, item_id, category, item_name, account_no, pay_type, payee_code, payee_name, payable_amount, amount, auto_debit, remark, status, paid_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(order_no, user_id_card, item_id, category, item_name, account_no, pay_type, payee_code, payee_name, payable_amount, amount, auto_debit, remark, 'paid', new Date().toISOString().replace('T', ' ').substring(0, 19));
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('payment', 'pay', user_id_card, `缴费订单${order_no}，${item_name}，金额${amount}元`);
  res.json({ data: { order_no } });
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const totalOrders = db.prepare("SELECT COUNT(*) as cnt FROM payment_orders WHERE status = 'paid'").get().cnt;
  const totalAmount = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payment_orders WHERE status = 'paid'").get().total;
  const categoryStats = db.prepare("SELECT p.category, COUNT(*) as count, SUM(o.amount) as total FROM payment_orders o JOIN payment_items p ON o.item_id = p.id WHERE o.status = 'paid' GROUP BY p.category").all();
  const monthlyStats = db.prepare("SELECT substr(paid_at,1,7) as month, COUNT(*) as count, SUM(amount) as total FROM payment_orders WHERE status = 'paid' AND paid_at IS NOT NULL GROUP BY substr(paid_at,1,7) ORDER BY month").all();
  res.json({ data: { totalOrders, totalAmount, categoryStats, monthlyStats } });
});

module.exports = router;
