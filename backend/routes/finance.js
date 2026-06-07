const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/products', (req, res) => {
  const db = getDB();
  const { product_type, status, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (product_type) { where += ' AND product_type = ?'; params.push(product_type); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM finance_products WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM finance_products WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/products', (req, res) => {
  const db = getDB();
  const { code, name, product_type, max_amount, annual_rate, max_periods, risk_rules } = req.body;
  try {
    db.prepare('INSERT INTO finance_products (code, name, product_type, max_amount, annual_rate, max_periods, risk_rules) VALUES (?,?,?,?,?,?,?)').run(code, name, product_type, max_amount, annual_rate, max_periods, risk_rules);
    res.json({ data: { message: '金融产品已创建' } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: '产品编码已存在' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/loans', (req, res) => {
  const db = getDB();
  const { status, product_id, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND l.status = ?'; params.push(status); }
  if (product_id) { where += ' AND l.product_id = ?'; params.push(product_id); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM loan_applications l WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT l.*, p.name as product_name, p.code as product_code FROM loan_applications l LEFT JOIN finance_products p ON l.product_id = p.id WHERE ${where} ORDER BY l.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/loans', (req, res) => {
  const db = getDB();
  const { product_id, user_id_card, user_name, apply_amount, apply_periods, collateral_type, collateral_desc } = req.body;
  const product = db.prepare('SELECT * FROM finance_products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: '金融产品不存在' });
  const rules = JSON.parse(product.risk_rules || '{}');
  const profile = db.prepare('SELECT * FROM credit_profiles WHERE id_card = ?').get(user_id_card);
  if (profile && rules.min_credit_score && profile.credit_score < rules.min_credit_score) {
    return res.status(400).json({ error: `信用评分${profile.credit_score}低于阈值${rules.min_credit_score}，不符合申请条件` });
  }
  if (apply_amount > product.max_amount) {
    return res.status(400).json({ error: `申请金额超过产品上限${product.max_amount}元` });
  }
  db.prepare('INSERT INTO loan_applications (product_id, user_id_card, user_name, apply_amount, apply_periods, collateral_type, collateral_desc, status) VALUES (?,?,?,?,?,?,?,?)').run(product_id, user_id_card, user_name, apply_amount, apply_periods || 12, collateral_type, collateral_desc, 'pending');
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('finance', 'apply_loan', user_id_card, `${user_name}申请${product.name}${apply_amount}元`);
  res.json({ data: { message: '贷款申请已提交' } });
});

router.get('/loans/:id', (req, res) => {
  const db = getDB();
  const loan = db.prepare(`
    SELECT l.*, p.name as product_name, p.code as product_code, 
           p.product_type, p.max_amount, p.annual_rate, p.risk_rules,
           cp.credit_score as profile_credit_score, cp.credit_level as profile_credit_level,
           cp.land_area as profile_land_area, cp.land_cert_no as profile_land_cert_no,
           cp.subsidy_total as profile_subsidy_total, cp.business_income as profile_business_income,
           cp.village as profile_village, cp.town as profile_town, cp.type as profile_type
    FROM loan_applications l 
    LEFT JOIN finance_products p ON l.product_id = p.id
    LEFT JOIN credit_profiles cp ON l.user_id_card = cp.id_card
    WHERE l.id = ?
  `).get(req.params.id);
  
  if (!loan) return res.status(404).json({ error: '贷款申请不存在' });
  
  const flows = db.prepare(`
    SELECT * FROM credit_flows 
    WHERE profile_id = (SELECT id FROM credit_profiles WHERE id_card = ?)
    ORDER BY flow_date DESC LIMIT 10
  `).all(loan.user_id_card);
  
  res.json({ data: { ...loan, flows } });
});

router.put('/loans/:id/review', (req, res) => {
  const db = getDB();
  const { status, approved_amount, review_remark } = req.body;
  db.prepare('UPDATE loan_applications SET status = ?, approved_amount = ?, review_remark = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(status, approved_amount || 0, review_remark || '', req.params.id);
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('finance', 'review_loan', '信贷员', `审核贷款ID=${req.params.id}，结果=${status}`);
  res.json({ data: { id: req.params.id } });
});

router.get('/livestocks', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`SELECT lm.*, la.user_name, la.apply_amount, fp.name as product_name FROM livestock_mortgages lm JOIN loan_applications la ON lm.loan_id = la.id JOIN finance_products fp ON la.product_id = fp.id ORDER BY lm.id DESC`).all();
  res.json({ data: rows });
});

router.post('/livestocks', (req, res) => {
  const db = getDB();
  const { loan_id, livestock_type, quantity, unit_value, ear_tag, registration_no } = req.body;
  const total_value = quantity * unit_value;
  db.prepare('INSERT INTO livestock_mortgages (loan_id, livestock_type, quantity, unit_value, total_value, ear_tag, registration_no, status) VALUES (?,?,?,?,?,?,?,?)').run(loan_id, livestock_type, quantity, unit_value, total_value, ear_tag, registration_no, 'registered');
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('finance', 'register_livestock', '信贷员', `登记活体抵押${livestock_type}${quantity}头/只`);
  res.json({ data: { message: '活体抵押登记成功', total_value } });
});

module.exports = router;
