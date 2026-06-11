const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authRequired, (req, res) => {
  res.json({ code: 0, data: req.user });
});

router.get('/contracts', authRequired, (req, res) => {
  const list = db.prepare('SELECT * FROM labor_contracts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ code: 0, data: list });
});

router.post('/contracts/create', authRequired, (req, res) => {
  const { contract_type, start_date, end_date, position, salary, work_place, enterprise_id, content } = req.body;
  const contract_no = 'HT' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000);
  db.prepare(`INSERT INTO labor_contracts (user_id, enterprise_id, contract_no, contract_type, start_date, end_date, position, salary, work_place, content, user_sign_status, user_sign_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', 'localtime'), 'signed_user')`).run(
    req.user.id, enterprise_id || null, contract_no, contract_type || '固定期限', start_date, end_date, position, salary, work_place || '江西省', content || ''
  );
  const item = db.prepare('SELECT * FROM labor_contracts WHERE contract_no = ?').get(contract_no);
  res.json({ code: 0, data: item, message: '合同已提交，等待企业签章' });
});

router.post('/contracts/sign/:id', authRequired, (req, res) => {
  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!contract) return res.status(404).json({ code: 404, message: '合同不存在' });
  db.prepare(`UPDATE labor_contracts SET user_sign_status = 1, user_sign_at = datetime('now', 'localtime'),
    status = CASE WHEN enterprise_sign_status = 1 THEN 'completed' ELSE 'signed_user' END WHERE id = ?`).run(contract.id);
  res.json({ code: 0, message: '电子签章成功' });
});

router.get('/unemployment', authRequired, (req, res) => {
  const list = db.prepare('SELECT * FROM unemployment_registrations WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ code: 0, data: list });
});

router.post('/unemployment/apply', authRequired, (req, res) => {
  const { education, previous_work, unemployment_reason, expected_salary, expected_position } = req.body;
  const registration_no = 'SY' + Date.now().toString().slice(-10);
  db.prepare(`INSERT INTO unemployment_registrations (user_id, registration_no, id_card, name, phone, education, previous_work, unemployment_reason, expected_salary, expected_position, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`).run(
    req.user.id, registration_no, req.user.id_card || '', req.user.name, req.user.phone || '',
    education || '', previous_work || '', unemployment_reason || '', expected_salary || 0, expected_position || ''
  );
  const item = db.prepare('SELECT * FROM unemployment_registrations WHERE registration_no = ?').get(registration_no);
  res.json({ code: 0, data: item, message: '失业登记已办结' });
});

router.get('/title-applications', authRequired, (req, res) => {
  const list = db.prepare('SELECT * FROM title_applications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ code: 0, data: list });
});

router.post('/title-applications/submit', authRequired, (req, res) => {
  const { current_title, apply_title, apply_category, education, work_years, materials } = req.body;
  const application_no = 'ZC' + Date.now().toString().slice(-10);
  db.prepare(`INSERT INTO title_applications (user_id, application_no, name, id_card, current_title, apply_title, apply_category, education, work_years, materials, review_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
    req.user.id, application_no, req.user.name, req.user.id_card || '',
    current_title || '', apply_title || '', apply_category || '', education || '', work_years || 0, JSON.stringify(materials || [])
  );
  const item = db.prepare('SELECT * FROM title_applications WHERE application_no = ?').get(application_no);
  res.json({ code: 0, data: item, message: '材料已提交，等待预审' });
});

router.get('/labor-disputes', authRequired, (req, res) => {
  const list = db.prepare('SELECT * FROM labor_dispute_applications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ code: 0, data: list });
});

router.post('/labor-disputes/submit', authRequired, (req, res) => {
  const { respondent_name, dispute_type, dispute_amount, description, evidence } = req.body;
  const application_no = 'LD' + Date.now().toString().slice(-10);
  db.prepare(`INSERT INTO labor_dispute_applications (user_id, application_no, applicant_name, applicant_phone, respondent_name, dispute_type, dispute_amount, description, evidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
    req.user.id, application_no, req.user.name, req.user.phone || '',
    respondent_name || '', dispute_type || '', dispute_amount || 0, description || '', JSON.stringify(evidence || [])
  );
  const item = db.prepare('SELECT * FROM labor_dispute_applications WHERE application_no = ?').get(application_no);
  res.json({ code: 0, data: item, message: '调解申请已提交' });
});

router.get('/policy-calc/social-insurance', authRequired, (req, res) => {
  const { base_salary, months, type } = req.query;
  const base = parseFloat(base_salary) || 5000;
  const m = parseInt(months) || 1;
  const personal_rates = { pension: 0.08, medical: 0.02, unemployment: 0.005 };
  const company_rates = { pension: 0.16, medical: 0.085, unemployment: 0.005, injury: 0.002, maternity: 0.01 };
  let monthly_personal = 0, monthly_company = 0;
  for (let k in personal_rates) monthly_personal += base * personal_rates[k];
  for (let k in company_rates) monthly_company += base * company_rates[k];
  const result = {
    base_salary: base,
    months: m,
    monthly_personal: Math.round(monthly_personal * 100) / 100,
    monthly_company: Math.round(monthly_company * 100) / 100,
    total_personal: Math.round(monthly_personal * m * 100) / 100,
    total_company: Math.round(monthly_company * m * 100) / 100,
    total: Math.round((monthly_personal + monthly_company) * m * 100) / 100,
    rates: { personal: personal_rates, company: company_rates }
  };
  if (req.user?.id) {
    db.prepare('INSERT INTO policy_calculations (user_id, calc_type, input_params, result) VALUES (?, ?, ?, ?)').run(
      req.user.id, 'social_insurance', JSON.stringify({ base_salary: base, months: m }), JSON.stringify(result)
    );
  }
  res.json({ code: 0, data: result });
});

router.get('/policy-calc/venture-loan', authRequired, (req, res) => {
  const { project_type, annual_revenue, employee_count, collateral } = req.query;
  const revenue = parseFloat(annual_revenue) || 50;
  const emp = parseInt(employee_count) || 5;
  const col = parseFloat(collateral) || 0;
  const baseLimit = {
    individual: 20,
    micro: 300,
    small: 500,
    medium: 600
  }[project_type] || 20;
  const revenueFactor = Math.min(revenue / 50, 1.5);
  const empFactor = Math.min(emp / 10, 1.2);
  const colFactor = col > 0 ? 1 + Math.min(col / 100, 1) : 1;
  let estimate = baseLimit * revenueFactor * empFactor * colFactor;
  const maxLimit = project_type === 'individual' ? 30 : 600;
  estimate = Math.min(estimate, maxLimit);
  const interest = 3.0;
  const result = {
    project_type: project_type || 'individual',
    annual_revenue: revenue,
    employee_count: emp,
    collateral: col,
    estimated_limit: Math.round(estimate * 100) / 100,
    max_limit: maxLimit,
    annual_interest_rate: interest,
    interest_year: Math.round(estimate * interest / 100 * 100) / 100,
    term_years: 3
  };
  if (req.user?.id) {
    db.prepare('INSERT INTO policy_calculations (user_id, calc_type, input_params, result) VALUES (?, ?, ?, ?)').run(
      req.user.id, 'venture_loan', JSON.stringify(req.query), JSON.stringify(result)
    );
  }
  res.json({ code: 0, data: result });
});

module.exports = router;
