const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/merchants', (req, res) => {
  const db = getDB();
  const { status, keyword, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (keyword) { where += ' AND (name LIKE ? OR contact LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM merchants WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM merchants WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/merchants', (req, res) => {
  const db = getDB();
  const { name, contact, phone, address, category, license_no } = req.body;
  db.prepare('INSERT INTO merchants (name, contact, phone, address, category, license_no, status) VALUES (?,?,?,?,?,?,?)').run(name, contact, phone, address, category, license_no, 'pending');
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('business', 'apply_merchant', contact, `商户${name}申请入驻`);
  res.json({ data: { message: '申请已提交，等待审核' } });
});

router.put('/merchants/:id/audit', (req, res) => {
  const db = getDB();
  const { status, audit_remark } = req.body;
  db.prepare('UPDATE merchants SET status = ?, audit_remark = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(status, audit_remark || '', req.params.id);
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('business', 'audit_merchant', 'admin', `审核商户ID=${req.params.id}，结果=${status}`);
  res.json({ data: { id: req.params.id } });
});

router.get('/coupons', (req, res) => {
  const db = getDB();
  const { merchant_id, status, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (merchant_id) { where += ' AND c.merchant_id = ?'; params.push(merchant_id); }
  if (status) { where += ' AND c.status = ?'; params.push(status); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM coupons c WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT c.*, m.name as merchant_name FROM coupons c LEFT JOIN merchants m ON c.merchant_id = m.id WHERE ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/coupons', (req, res) => {
  const db = getDB();
  const { merchant_id, title, discount_type, discount_value, min_amount, total_count, expire_at } = req.body;
  db.prepare('INSERT INTO coupons (merchant_id, title, discount_type, discount_value, min_amount, total_count, expire_at) VALUES (?,?,?,?,?,?,?)').run(merchant_id, title, discount_type, discount_value, min_amount || 0, total_count, expire_at);
  res.json({ data: { message: '优惠券已创建' } });
});

router.post('/coupons/verify', (req, res) => {
  const db = getDB();
  const { coupon_id, user_id_card, verify_code } = req.body;
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(coupon_id);
  if (!coupon) return res.status(404).json({ error: '优惠券不存在' });
  if (coupon.used_count >= coupon.total_count) return res.status(400).json({ error: '优惠券已领完' });
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon_id);
  db.prepare('INSERT INTO coupon_verifications (coupon_id, user_id_card, verify_code) VALUES (?,?,?)').run(coupon_id, user_id_card, verify_code);
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('business', 'verify_coupon', user_id_card, `核销优惠券ID=${coupon_id}`);
  res.json({ data: { message: '核销成功' } });
});

router.get('/installments', (req, res) => {
  const db = getDB();
  const { status, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND i.status = ?'; params.push(status); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM installment_applications i WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT i.*, m.name as merchant_name FROM installment_applications i LEFT JOIN merchants m ON i.merchant_id = m.id WHERE ${where} ORDER BY i.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/installments', (req, res) => {
  const db = getDB();
  const { user_id_card, merchant_id, amount, periods } = req.body;
  db.prepare('INSERT INTO installment_applications (user_id_card, merchant_id, amount, periods, status) VALUES (?,?,?,?,?)').run(user_id_card, merchant_id, amount, periods || 12, 'pending');
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('business', 'apply_installment', user_id_card, `申请消费分期${amount}元`);
  res.json({ data: { message: '分期申请已提交' } });
});

module.exports = router;
