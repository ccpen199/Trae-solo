require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58890;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48890}` }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/achievements', (req, res) => {
  const rows = db.prepare('SELECT * FROM achievements ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/achievements/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM achievements WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/achievements', (req, res) => {
  const { name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, patent_number, paper_doi, software_copyright, prototype_description } = req.body;
  const result = db.prepare(`
    INSERT INTO achievements (name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, patent_number, paper_doi, software_copyright, prototype_description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, inventors, college, maturity_level, ownership_clear ? 1 : 0, ownership_remark, patent_number, paper_doi, software_copyright, prototype_description, ownership_clear ? 'registered' : 'draft');
  res.json({ id: result.lastInsertRowid, ...req.body, status: ownership_clear ? 'registered' : 'draft' });
});

app.put('/api/achievements/:id', (req, res) => {
  const { name, type, inventors, college, maturity_level, ownership_clear, ownership_remark, patent_number, paper_doi, software_copyright, prototype_description, status } = req.body;
  db.prepare(`
    UPDATE achievements SET name=?, type=?, inventors=?, college=?, maturity_level=?, ownership_clear=?, ownership_remark=?, patent_number=?, paper_doi=?, software_copyright=?, prototype_description=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, type, inventors, college, maturity_level, ownership_clear ? 1 : 0, ownership_remark, patent_number, paper_doi, software_copyright, prototype_description, status || (ownership_clear ? 'registered' : 'draft'), req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/achievements/:id', (req, res) => {
  db.prepare('DELETE FROM achievements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/achievements/:id/evaluations', (req, res) => {
  const rows = db.prepare('SELECT * FROM evaluations WHERE achievement_id = ? ORDER BY version DESC').all(req.params.id);
  res.json(rows);
});

app.post('/api/achievements/:id/evaluations', (req, res) => {
  const achievement_id = req.params.id;
  const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achievement_id);
  if (!achievement) return res.status(404).json({ error: '成就不存在' });
  if (!achievement.ownership_clear) return res.status(400).json({ error: '权属不清，不能进入评估流程' });

  const maxVersion = db.prepare('SELECT MAX(version) as max FROM evaluations WHERE achievement_id = ?').get(achievement_id);
  const version = (maxVersion?.max || 0) + 1;

  const { market_scene, tech_advantage, conclusion, expert_opinion, valuation_basis, valuation_amount, status, created_by } = req.body;
  const result = db.prepare(`
    INSERT INTO evaluations (achievement_id, version, market_scene, tech_advantage, conclusion, expert_opinion, valuation_basis, valuation_amount, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(achievement_id, version, market_scene, tech_advantage, conclusion, expert_opinion, valuation_basis, valuation_amount, status || 'pending', created_by);

  if (status === 'approved') {
    db.prepare('UPDATE achievements SET status = ? WHERE id = ?').run('evaluated', achievement_id);
  }

  res.json({ id: result.lastInsertRowid, version, ...req.body });
});

app.get('/api/companies', (req, res) => {
  const rows = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/companies', (req, res) => {
  const { name, contact_person, contact_phone, contact_email, industry } = req.body;
  const result = db.prepare('INSERT INTO companies (name, contact_person, contact_phone, contact_email, industry) VALUES (?, ?, ?, ?, ?)').run(name, contact_person, contact_phone, contact_email, industry);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/engagements', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, a.name as achievement_name, c.name as company_name
    FROM engagements e
    JOIN achievements a ON e.achievement_id = a.id
    JOIN companies c ON e.company_id = c.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/engagements', (req, res) => {
  const { achievement_id, company_id, status, nda_signed, nda_date, trial_progress, requirement_gap } = req.body;
  const result = db.prepare(`
    INSERT INTO engagements (achievement_id, company_id, status, nda_signed, nda_date, trial_progress, requirement_gap)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(achievement_id, company_id, status || 'initial', nda_signed ? 1 : 0, nda_date, trial_progress, requirement_gap);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/engagements/:id/communications', (req, res) => {
  const rows = db.prepare('SELECT * FROM communication_records WHERE engagement_id = ? ORDER BY date DESC').all(req.params.id);
  res.json(rows);
});

app.post('/api/engagements/:id/communications', (req, res) => {
  const { date, content, created_by } = req.body;
  const result = db.prepare('INSERT INTO communication_records (engagement_id, date, content, created_by) VALUES (?, ?, ?, ?)').run(req.params.id, date, content, created_by);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/contracts', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, a.name as achievement_name, comp.name as company_name
    FROM contracts c
    JOIN achievements a ON c.achievement_id = a.id
    LEFT JOIN engagements e ON c.engagement_id = e.id
    LEFT JOIN companies comp ON e.company_id = comp.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

app.get('/api/contracts/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, a.name as achievement_name, comp.name as company_name
    FROM contracts c
    JOIN achievements a ON c.achievement_id = a.id
    LEFT JOIN engagements e ON c.engagement_id = e.id
    LEFT JOIN companies comp ON e.company_id = comp.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/contracts', (req, res) => {
  const { achievement_id, engagement_id, contract_number, license_type, amount, payment_schedule, inventor_share, college_share, status, signed_date, effective_date, expiry_date } = req.body;
  const result = db.prepare(`
    INSERT INTO contracts (achievement_id, engagement_id, contract_number, license_type, amount, payment_schedule, inventor_share, college_share, status, signed_date, effective_date, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(achievement_id, engagement_id, contract_number, license_type, amount, payment_schedule, inventor_share, college_share, status || 'draft', signed_date, effective_date, expiry_date);

  const contractId = result.lastInsertRowid;
  if (payment_schedule) {
    const payments = JSON.parse(payment_schedule);
    const paymentStmt = db.prepare('INSERT INTO payments (contract_id, amount, due_date, status) VALUES (?, ?, ?, ?)');
    payments.forEach(p => paymentStmt.run(contractId, p.amount, p.due_date, 'pending'));
  }

  res.json({ id: contractId, ...req.body });
});

app.put('/api/contracts/:id', (req, res) => {
  const { achievement_id, engagement_id, contract_number, license_type, amount, payment_schedule, inventor_share, college_share, status, signed_date, effective_date, expiry_date } = req.body;
  db.prepare(`
    UPDATE contracts SET achievement_id=?, engagement_id=?, contract_number=?, license_type=?, amount=?, payment_schedule=?, inventor_share=?, college_share=?, status=?, signed_date=?, effective_date=?, expiry_date=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(achievement_id, engagement_id, contract_number, license_type, amount, payment_schedule, inventor_share, college_share, status, signed_date, effective_date, expiry_date, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

app.post('/api/contracts/:id/changes', (req, res) => {
  const contract_id = req.params.id;
  const { change_type, change_content, reason, approved_by } = req.body;
  const maxVersion = db.prepare('SELECT MAX(version) as max FROM contract_changes WHERE contract_id = ?').get(contract_id);
  const version = (maxVersion?.max || 0) + 1;
  const result = db.prepare(`
    INSERT INTO contract_changes (contract_id, version, change_type, change_content, reason, approved_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(contract_id, version, change_type, change_content, reason, approved_by);
  res.json({ id: result.lastInsertRowid, version, ...req.body });
});

app.get('/api/contracts/:id/payments', (req, res) => {
  const rows = db.prepare('SELECT * FROM payments WHERE contract_id = ? ORDER BY due_date').all(req.params.id);
  res.json(rows);
});

app.post('/api/payments/:id/receive', (req, res) => {
  const { actual_date, remark } = req.body;
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: '付款不存在' });

  db.prepare('UPDATE payments SET status = ?, actual_date = ?, remark = ? WHERE id = ?').run('received', actual_date, remark, req.params.id);

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(payment.contract_id);
  const inventorAmount = payment.amount * (contract.inventor_share || 0) / 100;
  const collegeAmount = payment.amount * (contract.college_share || 0) / 100;
  const universityAmount = payment.amount - inventorAmount - collegeAmount;

  db.prepare(`
    INSERT INTO revenue_ledger (payment_id, contract_id, achievement_id, amount, inventor_amount, college_amount, university_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(payment.id, payment.contract_id, contract.achievement_id, payment.amount, inventorAmount, collegeAmount, universityAmount);

  res.json({ success: true, inventorAmount, collegeAmount, universityAmount });
});

app.get('/api/revenue-ledger', (req, res) => {
  const rows = db.prepare(`
    SELECT rl.*, a.name as achievement_name, c.contract_number
    FROM revenue_ledger rl
    JOIN achievements a ON rl.achievement_id = a.id
    JOIN contracts c ON rl.contract_id = c.id
    ORDER BY rl.created_at DESC
  `).all();
  res.json(rows);
});

app.get('/api/dashboard/stats', (req, res) => {
  const totalAchievements = db.prepare('SELECT COUNT(*) as count FROM achievements').get().count;
  const registered = db.prepare("SELECT COUNT(*) as count FROM achievements WHERE status = 'registered'").get().count;
  const evaluated = db.prepare("SELECT COUNT(*) as count FROM achievements WHERE status = 'evaluated'").get().count;
  const contracted = db.prepare("SELECT COUNT(*) as count FROM achievements WHERE status = 'contracted'").get().count;
  const totalContracts = db.prepare('SELECT COUNT(*) as count FROM contracts').get().count;
  const totalRevenue = db.prepare('SELECT SUM(amount) as total FROM revenue_ledger').get().total || 0;
  const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'").get().count;
  const overduePayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'pending' AND due_date < DATE('now')").get().count;

  res.json({
    totalAchievements,
    registered,
    evaluated,
    contracted,
    totalContracts,
    totalRevenue,
    pendingPayments,
    overduePayments
  });
});

app.get('/api/dashboard/revenue-by-college', (req, res) => {
  const rows = db.prepare(`
    SELECT a.college, SUM(rl.amount) as total
    FROM revenue_ledger rl
    JOIN achievements a ON rl.achievement_id = a.id
    GROUP BY a.college
    ORDER BY total DESC
  `).all();
  res.json(rows);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
