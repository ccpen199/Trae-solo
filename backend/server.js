require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const moment = require('moment');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58817;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function generateCaseNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const count = db.prepare('SELECT COUNT(*) as count FROM cases WHERE strftime("%Y%m", created_at) = ?').get(`${year}${month}`);
  return `LDZC-${year}${month}-${String(count.count + 1).padStart(4, '0')}`;
}

function checkArbitrationDeadline(deadline) {
  if (!deadline) return null;
  const daysLeft = moment(deadline).diff(moment(), 'days');
  if (daysLeft < 0) {
    return { level: 'danger', message: `已超过仲裁时效 ${Math.abs(daysLeft)} 天` };
  } else if (daysLeft <= 7) {
    return { level: 'warning', message: `仲裁时效剩余 ${daysLeft} 天，即将到期` };
  }
  return null;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/cases', (req, res) => {
  const { status, lawyer_id } = req.query;
  let query = 'SELECT * FROM cases WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (lawyer_id) {
    query += ' AND lawyer_id = ?';
    params.push(lawyer_id);
  }
  
  query += ' ORDER BY created_at DESC';
  const cases = db.prepare(query).all(...params);
  
  cases.forEach(c => {
    c.risk_warning = checkArbitrationDeadline(c.arbitration_deadline);
  });
  
  res.json(cases);
});

app.get('/api/cases/:id', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案件不存在' });
  }
  caseItem.risk_warning = checkArbitrationDeadline(caseItem.arbitration_deadline);
  res.json(caseItem);
});

app.post('/api/cases', (req, res) => {
  const {
    client_name, client_phone, respondent, dispute_type,
    claim_amount, employment_relation, start_date, end_date,
    dispute_date, arbitration_deadline, lawyer_id, lawyer_name, description
  } = req.body;

  const case_number = generateCaseNumber();
  
  const result = db.prepare(`
    INSERT INTO cases (
      case_number, client_name, client_phone, respondent, dispute_type,
      claim_amount, employment_relation, start_date, end_date, dispute_date,
      arbitration_deadline, lawyer_id, lawyer_name, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    case_number, client_name, client_phone, respondent, dispute_type,
    claim_amount || 0, employment_relation, start_date, end_date, dispute_date,
    arbitration_deadline, lawyer_id, lawyer_name, description
  );

  db.prepare('INSERT INTO case_logs (case_id, action, description, operator) VALUES (?, ?, ?, ?)')
    .run(result.lastInsertRowid, '创建案件', `创建案件 ${case_number}`, '系统');

  res.json({ id: result.lastInsertRowid, case_number });
});

app.put('/api/cases/:id', (req, res) => {
  const {
    client_name, client_phone, respondent, dispute_type,
    claim_amount, employment_relation, start_date, end_date,
    dispute_date, arbitration_deadline, lawyer_id, lawyer_name, status, description
  } = req.body;

  db.prepare(`
    UPDATE cases SET
      client_name = ?, client_phone = ?, respondent = ?, dispute_type = ?,
      claim_amount = ?, employment_relation = ?, start_date = ?, end_date = ?,
      dispute_date = ?, arbitration_deadline = ?, lawyer_id = ?, lawyer_name = ?,
      status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    client_name, client_phone, respondent, dispute_type,
    claim_amount || 0, employment_relation, start_date, end_date, dispute_date,
    arbitration_deadline, lawyer_id, lawyer_name, status, description, req.params.id
  );

  db.prepare('INSERT INTO case_logs (case_id, action, description, operator) VALUES (?, ?, ?, ?)')
    .run(req.params.id, '更新案件', '更新案件信息', '系统');

  res.json({ success: true });
});

app.put('/api/cases/:id/transfer', (req, res) => {
  const { lawyer_id, lawyer_name, reason } = req.body;
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  
  if (!caseItem) {
    return res.status(404).json({ error: '案件不存在' });
  }

  db.prepare('UPDATE cases SET lawyer_id = ?, lawyer_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(lawyer_id, lawyer_name, req.params.id);

  db.prepare('INSERT INTO case_logs (case_id, action, description, operator) VALUES (?, ?, ?, ?)')
    .run(req.params.id, '案件转办', `从 ${caseItem.lawyer_name || '未分配'} 转至 ${lawyer_name}，原因：${reason}`, '系统');

  res.json({ success: true });
});

app.get('/api/cases/:id/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM case_logs WHERE case_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(logs);
});

app.get('/api/evidences', (req, res) => {
  const { case_id } = req.query;
  let query = 'SELECT * FROM evidences WHERE 1=1';
  const params = [];
  
  if (case_id) {
    query += ' AND case_id = ?';
    params.push(case_id);
  }
  
  query += ' ORDER BY created_at DESC';
  const evidences = db.prepare(query).all(...params);
  res.json(evidences);
});

app.post('/api/evidences', (req, res) => {
  const { case_id, type, name, description, claim_purpose, proof_purpose, uploaded_by } = req.body;

  const result = db.prepare(`
    INSERT INTO evidences (case_id, type, name, description, claim_purpose, proof_purpose, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(case_id, type, name, description, claim_purpose, proof_purpose, uploaded_by);

  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/evidences/:id', (req, res) => {
  db.prepare('DELETE FROM evidences WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/documents', (req, res) => {
  const { case_id, type } = req.query;
  let query = 'SELECT * FROM documents WHERE 1=1';
  const params = [];
  
  if (case_id) {
    query += ' AND case_id = ?';
    params.push(case_id);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  const documents = db.prepare(query).all(...params);
  res.json(documents);
});

app.get('/api/documents/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文书不存在' });
  }
  res.json(doc);
});

app.post('/api/documents', (req, res) => {
  const { case_id, type, title, content, created_by } = req.body;

  const maxVersion = db.prepare('SELECT MAX(version) as max FROM documents WHERE case_id = ? AND type = ?').get(case_id, type);
  const version = (maxVersion.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO documents (case_id, type, version, title, content, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(case_id, type, version, title, content, created_by);

  res.json({ id: result.lastInsertRowid, version });
});

app.put('/api/documents/:id/review', (req, res) => {
  const { reviewer_id, reviewer_name, status, review_comment } = req.body;

  db.prepare(`
    UPDATE documents SET
      status = ?, reviewer_id = ?, reviewer_name = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, reviewer_id, reviewer_name, review_comment, req.params.id);

  res.json({ success: true });
});

app.get('/api/documents/:id/history', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文书不存在' });
  }
  
  const history = db.prepare('SELECT * FROM documents WHERE case_id = ? AND type = ? ORDER BY version DESC').all(doc.case_id, doc.type);
  res.json(history);
});

app.get('/api/hearings', (req, res) => {
  const { case_id } = req.query;
  let query = 'SELECT * FROM hearings WHERE 1=1';
  const params = [];
  
  if (case_id) {
    query += ' AND case_id = ?';
    params.push(case_id);
  }
  
  query += ' ORDER BY scheduled_date DESC';
  const hearings = db.prepare(query).all(...params);
  res.json(hearings);
});

app.post('/api/hearings', (req, res) => {
  const {
    case_id, type, scheduled_date, scheduled_time, location,
    attendees, mediation_plan, ruling_result, ruling_date, execution_tasks, notes
  } = req.body;

  const result = db.prepare(`
    INSERT INTO hearings (
      case_id, type, scheduled_date, scheduled_time, location,
      attendees, mediation_plan, ruling_result, ruling_date, execution_tasks, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    case_id, type, scheduled_date, scheduled_time, location,
    attendees, mediation_plan, ruling_result, ruling_date, execution_tasks, notes
  );

  res.json({ id: result.lastInsertRowid });
});

app.put('/api/hearings/:id', (req, res) => {
  const {
    scheduled_date, scheduled_time, location, attendees,
    mediation_plan, ruling_result, ruling_date, execution_tasks, notes
  } = req.body;

  db.prepare(`
    UPDATE hearings SET
      scheduled_date = ?, scheduled_time = ?, location = ?, attendees = ?,
      mediation_plan = ?, ruling_result = ?, ruling_date = ?, execution_tasks = ?, notes = ?
    WHERE id = ?
  `).run(
    scheduled_date, scheduled_time, location, attendees,
    mediation_plan, ruling_result, ruling_date, execution_tasks, notes, req.params.id
  );

  res.json({ success: true });
});

app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  
  const users = db.prepare(query).all(...params);
  res.json(users);
});

app.get('/api/dashboard/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM cases').get();
  const pending = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = "pending"').get();
  const hearing = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = "hearing"').get();
  const closed = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = "closed"').get();
  const totalAmount = db.prepare('SELECT SUM(claim_amount) as total FROM cases').get();

  const upcomingHearings = db.prepare(`
    SELECT h.*, c.case_number, c.client_name 
    FROM hearings h 
    JOIN cases c ON h.case_id = c.id 
    WHERE h.scheduled_date >= date('now') 
    ORDER BY h.scheduled_date ASC 
    LIMIT 5
  `).all();

  res.json({
    total_cases: total.count,
    pending_cases: pending.count,
    hearing_cases: hearing.count,
    closed_cases: closed.count,
    total_claim_amount: totalAmount.total || 0,
    upcoming_hearings: upcomingHearings
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`劳动仲裁系统后端运行在 http://127.0.0.1:${PORT}`);
});
