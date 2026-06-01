require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58796;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48796}` }));
app.use(express.json());

initDatabase();

function generateApplicationNo() {
  const date = new Date();
  const prefix = 'LOAN' + date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const count = db.prepare('SELECT COUNT(*) as count FROM applications WHERE application_no LIKE ?').get(prefix + '%').count;
  return prefix + (count + 1).toString().padStart(4, '0');
}

function calculateDataCompleteness(app) {
  let complete = 0;
  let total = 5;
  if (app.id_card) complete++;
  if (app.bank_card) complete++;
  if (app.contact_info) complete++;
  if (app.business_proof) complete++;
  if (app.applicant_name && app.applicant_phone) complete++;
  return Math.round((complete / total) * 100);
}

app.get('/api/applications', (req, res) => {
  const { status, channel, product, user, role } = req.query;
  let query = 'SELECT * FROM applications WHERE 1=1';
  const params = [];
  
  if (role === 'manager' || role === 'officer') {
    query += ' AND created_by = ?';
    params.push(user);
  }
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (channel) {
    query += ' AND channel = ?';
    params.push(channel);
  }
  if (product) {
    query += ' AND product = ?';
    params.push(product);
  }
  
  query += ' ORDER BY created_at DESC';
  const applications = db.prepare(query).all(...params);
  res.json(applications);
});

app.get('/api/applications/:id', (req, res) => {
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  const authorizations = db.prepare('SELECT * FROM authorization_records WHERE application_id = ? ORDER BY created_at DESC').all(req.params.id);
  const screenings = db.prepare('SELECT * FROM screening_rules WHERE application_id = ? ORDER BY created_at DESC').all(req.params.id);
  const supplements = db.prepare('SELECT * FROM supplement_records WHERE application_id = ? ORDER BY supplement_time DESC').all(req.params.id);
  const transfers = db.prepare('SELECT * FROM review_transfers WHERE application_id = ? ORDER BY transfer_time DESC').all(req.params.id);
  
  res.json({
    application,
    authorizations,
    screenings,
    supplements,
    transfers
  });
});

app.post('/api/applications', (req, res) => {
  const { channel, product, account_manager, applicant_name, applicant_phone, application_amount, created_by } = req.body;
  
  const applicationNo = generateApplicationNo();
  const result = db.prepare(`
    INSERT INTO applications (application_no, channel, product, account_manager, applicant_name, applicant_phone, application_amount, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(applicationNo, channel, product, account_manager, applicant_name, applicant_phone, application_amount, created_by);
  
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  const completeness = calculateDataCompleteness(app);
  db.prepare('UPDATE applications SET data_completeness = ? WHERE id = ?').run(completeness, result.lastInsertRowid);
  
  res.json({ id: result.lastInsertRowid, application_no: applicationNo });
});

app.put('/api/applications/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  const { id_card, bank_card, contact_info, business_proof, status, approved_amount } = req.body;
  const newVersion = app.version + 1;
  
  const snapshot = JSON.stringify(app);
  
  db.prepare(`
    INSERT INTO review_transfers (application_id, transfer_type, from_user, to_user, application_version, data_snapshot, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'update', req.body.updated_by || 'system', req.body.updated_by || 'system', newVersion, snapshot, '数据更新');
  
  db.prepare(`
    UPDATE applications 
    SET id_card = COALESCE(?, id_card),
        bank_card = COALESCE(?, bank_card),
        contact_info = COALESCE(?, contact_info),
        business_proof = COALESCE(?, business_proof),
        status = COALESCE(?, status),
        approved_amount = COALESCE(?, approved_amount),
        version = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id_card, bank_card, contact_info, business_proof, status, approved_amount, newVersion, req.params.id);
  
  const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  const completeness = calculateDataCompleteness(updatedApp);
  db.prepare('UPDATE applications SET data_completeness = ? WHERE id = ?').run(completeness, req.params.id);
  
  res.json({ success: true, version: newVersion });
});

app.post('/api/applications/:id/authorize', (req, res) => {
  const { authorization_scope, query_type, created_by } = req.body;
  
  const queryResult = Math.random() > 0.3 ? 'success' : 'failed';
  const failureReason = queryResult === 'failed' ? (Math.random() > 0.5 ? '授权过期' : '征信查询失败') : null;
  
  db.prepare(`
    INSERT INTO authorization_records (application_id, authorization_time, authorization_scope, query_result, failure_reason, query_type, created_by)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
  `).run(req.params.id, authorization_scope, queryResult, failureReason, query_type, created_by);
  
  if (queryResult === 'failed') {
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('authorization_failed', req.params.id);
  }
  
  res.json({ success: true, query_result: queryResult, failure_reason: failureReason });
});

app.post('/api/applications/:id/screen', (req, res) => {
  const { screened_by } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  
  if (app.data_completeness < 100) {
    return res.json({ success: false, status: app.status, handling_opinion: '资料不完整，请先补全资料', risk_tags: [] });
  }
  
  const hasAuth = db.prepare('SELECT COUNT(*) as count FROM authorization_records WHERE application_id = ? AND query_result = ?').get(req.params.id, 'success');
  if (hasAuth.count === 0) {
    return res.json({ success: false, status: app.status, handling_opinion: '请先完成授权查询', risk_tags: [] });
  }
  
  const rules = [
    { name: '资料完整性', result: 'pass', opinion: '' },
    { name: '授权验证', result: 'pass', opinion: '' },
    { name: '年龄校验', result: Math.random() > 0.1 ? 'pass' : 'fail', opinion: Math.random() > 0.1 ? '' : '年龄不符合要求' },
    { name: '征信查询', result: Math.random() > 0.2 ? 'pass' : 'fail', opinion: Math.random() > 0.2 ? '' : '征信有逾期记录' },
    { name: '收入验证', result: Math.random() > 0.15 ? 'pass' : 'fail', opinion: Math.random() > 0.15 ? '' : '收入不足以覆盖还款' },
    { name: '行业风险', result: Math.random() > 0.1 ? 'pass' : 'fail', opinion: Math.random() > 0.1 ? '' : '高风险行业' },
    { name: '反欺诈校验', result: Math.random() > 0.05 ? 'pass' : 'fail', opinion: Math.random() > 0.05 ? '' : '疑似欺诈行为' }
  ];
  
  const insertRule = db.prepare(`
    INSERT INTO screening_rules (application_id, rule_name, rule_result, risk_level, handling_opinion)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  let allPass = true;
  const riskTags = [];
  
  rules.forEach(rule => {
    const riskLevel = rule.result === 'pass' ? 'low' : 'high';
    insertRule.run(req.params.id, rule.name, rule.result, riskLevel, rule.opinion);
    if (rule.result === 'fail') {
      allPass = false;
      riskTags.push(rule.name);
    }
  });
  
  let finalStatus = allPass ? 'screening_passed' : 'manual_review';
  let handlingOpinion = allPass ? '通过初筛，进入信审' : '存在风险项，需人工复核';
  
  if (riskTags.length >= 3) {
    finalStatus = 'rejected';
    handlingOpinion = '多项规则命中，直接拒绝';
  }
  
  db.prepare('UPDATE applications SET status = ?, risk_tags = ? WHERE id = ?').run(finalStatus, riskTags.join(','), req.params.id);
  
  res.json({ success: true, status: finalStatus, handling_opinion: handlingOpinion, risk_tags: riskTags });
});

app.post('/api/applications/:id/transfer', (req, res) => {
  const { transfer_type, from_user, to_user, notes } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  
  const snapshot = JSON.stringify(app);
  
  db.prepare(`
    INSERT INTO review_transfers (application_id, transfer_type, from_user, to_user, application_version, data_snapshot, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, transfer_type, from_user, to_user, app.version, snapshot, notes);
  
  let newStatus = app.status;
  if (transfer_type === 'submit') newStatus = 'reviewing';
  else if (transfer_type === 'return') newStatus = 'pending_supplement';
  else if (transfer_type === 'cancel') newStatus = 'cancelled';
  else if (transfer_type === 'approve') newStatus = 'approved';
  else if (transfer_type === 'reject') newStatus = 'rejected';
  
  db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);
  
  res.json({ success: true, new_status: newStatus });
});

app.post('/api/applications/:id/supplement', (req, res) => {
  const { document_type, new_data, supplemented_by, notes } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  
  let oldData = '';
  if (document_type === 'id_card') oldData = app.id_card;
  else if (document_type === 'bank_card') oldData = app.bank_card;
  else if (document_type === 'contact_info') oldData = app.contact_info;
  else if (document_type === 'business_proof') oldData = app.business_proof;
  
  db.prepare(`
    INSERT INTO supplement_records (application_id, document_type, supplemented_by, old_data, new_data, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, document_type, supplemented_by, oldData, new_data, notes);
  
  const newVersion = app.version + 1;
  const snapshot = JSON.stringify(app);
  
  db.prepare(`
    INSERT INTO review_transfers (application_id, transfer_type, from_user, to_user, application_version, data_snapshot, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'supplement', supplemented_by, supplemented_by, newVersion, snapshot, `补充${document_type}`);
  
  let updateSql = 'UPDATE applications SET version = ?, updated_at = CURRENT_TIMESTAMP';
  const params = [newVersion];
  
  if (document_type === 'id_card') {
    updateSql += ', id_card = ?';
    params.push(new_data);
  } else if (document_type === 'bank_card') {
    updateSql += ', bank_card = ?';
    params.push(new_data);
  } else if (document_type === 'contact_info') {
    updateSql += ', contact_info = ?';
    params.push(new_data);
  } else if (document_type === 'business_proof') {
    updateSql += ', business_proof = ?';
    params.push(new_data);
  }
  
  updateSql += ' WHERE id = ?';
  params.push(req.params.id);
  
  db.prepare(updateSql).run(...params);
  
  const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  const completeness = calculateDataCompleteness(updatedApp);
  db.prepare('UPDATE applications SET data_completeness = ? WHERE id = ?').run(completeness, req.params.id);
  
  if (completeness === 100 && app.status === 'pending_supplement') {
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('pending', req.params.id);
  }
  
  res.json({ success: true, version: newVersion, data_completeness: completeness });
});

app.get('/api/todos', (req, res) => {
  const { assignee } = req.query;
  let query = 'SELECT t.*, a.application_no, a.applicant_name, a.status FROM todo_items t JOIN applications a ON t.application_id = a.id WHERE t.status = ?';
  const params = ['pending'];
  
  if (assignee) {
    query += ' AND t.assignee = ?';
    params.push(assignee);
  }
  
  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

app.get('/api/stats', (req, res) => {
  const { user, role } = req.query;
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (role === 'manager' || role === 'officer') {
    whereClause += ' AND created_by = ?';
    params.push(user);
  }
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause}`).get(...params).count;
  
  const pending = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause} AND status = ?`).get(...[...params, 'pending']).count;
  const reviewing = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause} AND status = ?`).get(...[...params, 'reviewing']).count;
  const approved = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause} AND status = ?`).get(...[...params, 'approved']).count;
  const rejected = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause} AND status = ?`).get(...[...params, 'rejected']).count;
  const supplement = db.prepare(`SELECT COUNT(*) as count FROM applications ${whereClause} AND status = ?`).get(...[...params, 'pending_supplement']).count;
  
  res.json({ total, pending, reviewing, approved, rejected, supplement });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
});
