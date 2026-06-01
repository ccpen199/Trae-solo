require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.BACKEND_PORT || 58810;
const JWT_SECRET = 'accounting-platform-secret-key';

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48810}` }));
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/clients', authenticateToken, (req, res) => {
  const { status, risk_level, accountant_id } = req.query;
  let query = 'SELECT c.*, u.name as accountant_name FROM clients c LEFT JOIN users u ON c.assigned_accountant_id = u.id WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (risk_level) {
    query += ' AND c.risk_level = ?';
    params.push(risk_level);
  }
  if (accountant_id) {
    query += ' AND c.assigned_accountant_id = ?';
    params.push(accountant_id);
  }

  query += ' ORDER BY c.created_at DESC';
  const clients = db.prepare(query).all(...params);
  res.json(clients);
});

app.get('/api/clients/:id', authenticateToken, (req, res) => {
  const client = db.prepare('SELECT c.*, u.name as accountant_name FROM clients c LEFT JOIN users u ON c.assigned_accountant_id = u.id WHERE c.id = ?').get(req.params.id);
  if (!client) {
    return res.status(404).json({ error: '客户不存在' });
  }
  res.json(client);
});

app.post('/api/clients', authenticateToken, (req, res) => {
  const {
    company_name, tax_id, contact_person, contact_phone, contact_email,
    contract_start_date, contract_end_date, tax_types, invoice_scale,
    service_package, delivery_habit, assigned_accountant_id, risk_level, risk_notes
  } = req.body;

  const result = db.prepare(`
    INSERT INTO clients (company_name, tax_id, contact_person, contact_phone, contact_email,
      contract_start_date, contract_end_date, tax_types, invoice_scale, service_package,
      delivery_habit, assigned_accountant_id, risk_level, risk_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    company_name, tax_id, contact_person, contact_phone, contact_email,
    contract_start_date, contract_end_date, tax_types, invoice_scale,
    service_package, delivery_habit, assigned_accountant_id, risk_level || 'normal', risk_notes
  );

  res.json({ id: result.lastInsertRowid, message: '客户创建成功' });
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
  const fields = Object.keys(req.body);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f]);
  values.push(req.params.id);

  db.prepare(`UPDATE clients SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '客户更新成功' });
});

app.get('/api/documents', authenticateToken, (req, res) => {
  const { client_id, month, type, status } = req.query;
  let query = 'SELECT d.*, c.company_name, u.name as uploader_name FROM documents d LEFT JOIN clients c ON d.client_id = c.id LEFT JOIN users u ON d.uploaded_by = u.id WHERE 1=1';
  const params = [];

  if (client_id) {
    query += ' AND d.client_id = ?';
    params.push(client_id);
  }
  if (month) {
    query += ' AND d.month = ?';
    params.push(month);
  }
  if (type) {
    query += ' AND d.type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.created_at DESC';
  const documents = db.prepare(query).all(...params);
  res.json(documents);
});

app.post('/api/documents', authenticateToken, (req, res) => {
  const { client_id, month, type, file_name, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO documents (client_id, month, type, file_name, notes, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(client_id, month, type, file_name, notes, req.user.id);

  res.json({ id: result.lastInsertRowid, message: '票据上传成功' });
});

app.put('/api/documents/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE documents SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: '状态更新成功' });
});

app.get('/api/documents/missing', authenticateToken, (req, res) => {
  const missing = db.prepare(`
    SELECT md.*, c.company_name FROM missing_documents md 
    JOIN clients c ON md.client_id = c.id 
    ORDER BY md.created_at DESC
  `).all();
  res.json(missing);
});

app.post('/api/documents/check-missing', authenticateToken, (req, res) => {
  const { month } = req.body;
  const docTypes = ['invoice', 'bank', 'salary', 'expense'];
  const clients = db.prepare('SELECT id FROM clients WHERE status = "active"').all();
  const inserted = [];

  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM documents WHERE client_id = ? AND month = ? AND type = ?');
  const insertStmt = db.prepare('INSERT INTO missing_documents (client_id, month, doc_type) VALUES (?, ?, ?)');

  clients.forEach(client => {
    docTypes.forEach(type => {
      const result = checkStmt.get(client.id, month, type);
      if (result.count === 0) {
        insertStmt.run(client.id, month, type);
        inserted.push({ client_id: client.id, month, type });
      }
    });
  });

  res.json({ inserted: inserted.length, items: inserted });
});

app.get('/api/accounting', authenticateToken, (req, res) => {
  const { client_id, month, status } = req.query;
  let query = 'SELECT ar.*, c.company_name, u1.name as handler_name, u2.name as reviewer_name FROM accounting_records ar LEFT JOIN clients c ON ar.client_id = c.id LEFT JOIN users u1 ON ar.handled_by = u1.id LEFT JOIN users u2 ON ar.reviewed_by = u2.id WHERE 1=1';
  const params = [];

  if (client_id) {
    query += ' AND ar.client_id = ?';
    params.push(client_id);
  }
  if (month) {
    query += ' AND ar.month = ?';
    params.push(month);
  }
  if (status) {
    query += ' AND ar.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ar.created_at DESC';
  const records = db.prepare(query).all(...params);
  res.json(records);
});

app.post('/api/accounting', authenticateToken, (req, res) => {
  const { client_id, month, voucher_count } = req.body;
  const result = db.prepare(`
    INSERT INTO accounting_records (client_id, month, voucher_count, handled_by)
    VALUES (?, ?, ?, ?)
  `).run(client_id, month, voucher_count || 0, req.user.id);

  res.json({ id: result.lastInsertRowid, message: '做账记录创建成功' });
});

app.put('/api/accounting/:id/status', authenticateToken, (req, res) => {
  const { status, review_notes } = req.body;
  const fields = ['status'];
  const values = [status];
  
  if (review_notes) {
    fields.push('review_notes');
    fields.push('reviewed_by');
    values.push(review_notes);
    values.push(req.user.id);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);

  db.prepare(`UPDATE accounting_records SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '状态更新成功' });
});

app.get('/api/tax-declarations', authenticateToken, (req, res) => {
  const { client_id, month, status, is_overdue } = req.query;
  let query = 'SELECT td.*, c.company_name, u1.name as handler_name, u2.name as reviewer_name FROM tax_declarations td LEFT JOIN clients c ON td.client_id = c.id LEFT JOIN users u1 ON td.handled_by = u1.id LEFT JOIN users u2 ON td.reviewed_by = u2.id WHERE 1=1';
  const params = [];

  if (client_id) {
    query += ' AND td.client_id = ?';
    params.push(client_id);
  }
  if (month) {
    query += ' AND td.month = ?';
    params.push(month);
  }
  if (status) {
    query += ' AND td.status = ?';
    params.push(status);
  }
  if (is_overdue) {
    query += ' AND td.is_overdue = 1';
  }

  query += ' ORDER BY td.created_at DESC';
  const declarations = db.prepare(query).all(...params);
  res.json(declarations);
});

app.post('/api/tax-declarations', authenticateToken, (req, res) => {
  const { client_id, month, tax_type, tax_amount } = req.body;
  const result = db.prepare(`
    INSERT INTO tax_declarations (client_id, month, tax_type, tax_amount, handled_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(client_id, month, tax_type, tax_amount || 0, req.user.id);

  res.json({ id: result.lastInsertRowid, message: '申报记录创建成功' });
});

app.put('/api/tax-declarations/:id/status', authenticateToken, (req, res) => {
  const { status, tax_amount, declaration_date, review_notes } = req.body;
  const fields = ['status'];
  const values = [status];

  if (tax_amount !== undefined) {
    fields.push('tax_amount');
    values.push(tax_amount);
  }
  if (declaration_date) {
    fields.push('declaration_date');
    values.push(declaration_date);
  }
  if (review_notes) {
    fields.push('review_notes');
    fields.push('reviewed_by');
    values.push(review_notes);
    values.push(req.user.id);
  }
  if (status === 'overdue') {
    fields.push('is_overdue');
    values.push(1);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);

  db.prepare(`UPDATE tax_declarations SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '申报状态更新成功' });
});

app.get('/api/monthly-reports', authenticateToken, (req, res) => {
  const { client_id, month, is_read } = req.query;
  let query = 'SELECT mr.*, c.company_name, u.name as creator_name FROM monthly_reports mr LEFT JOIN clients c ON mr.client_id = c.id LEFT JOIN users u ON mr.created_by = u.id WHERE 1=1';
  const params = [];

  if (client_id) {
    query += ' AND mr.client_id = ?';
    params.push(client_id);
  }
  if (month) {
    query += ' AND mr.month = ?';
    params.push(month);
  }
  if (is_read !== undefined) {
    query += ' AND mr.is_read = ?';
    params.push(is_read ? 1 : 0);
  }

  query += ' ORDER BY mr.created_at DESC';
  const reports = db.prepare(query).all(...params);
  res.json(reports);
});

app.post('/api/monthly-reports', authenticateToken, (req, res) => {
  const { client_id, month, revenue, cost, profit, tax_amount, voucher_count, content } = req.body;
  const result = db.prepare(`
    INSERT INTO monthly_reports (client_id, month, revenue, cost, profit, tax_amount, voucher_count, content, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client_id, month, revenue || 0, cost || 0, profit || 0, tax_amount || 0, voucher_count || 0, content, req.user.id);

  res.json({ id: result.lastInsertRowid, message: '月报创建成功' });
});

app.put('/api/monthly-reports/:id', authenticateToken, (req, res) => {
  const { is_read, client_feedback, renewal_opportunity, sent_at } = req.body;
  const fields = [];
  const values = [];

  if (is_read !== undefined) {
    fields.push('is_read');
    fields.push('read_at');
    values.push(is_read ? 1 : 0);
    values.push(is_read ? new Date().toISOString() : null);
  }
  if (client_feedback !== undefined) {
    fields.push('client_feedback');
    values.push(client_feedback);
  }
  if (renewal_opportunity !== undefined) {
    fields.push('renewal_opportunity');
    values.push(renewal_opportunity);
  }
  if (sent_at) {
    fields.push('sent_at');
    values.push(sent_at);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);

  db.prepare(`UPDATE monthly_reports SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '月报更新成功' });
});

app.get('/api/renewals', authenticateToken, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT r.*, c.company_name, c.contract_end_date as client_contract_end FROM renewals r JOIN clients c ON r.client_id = c.id WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.contract_end_date ASC';
  const renewals = db.prepare(query).all(...params);
  res.json(renewals);
});

app.post('/api/renewals', authenticateToken, (req, res) => {
  const { client_id, contract_end_date } = req.body;
  const result = db.prepare(`
    INSERT INTO renewals (client_id, contract_end_date)
    VALUES (?, ?)
  `).run(client_id, contract_end_date);

  res.json({ id: result.lastInsertRowid, message: '续费提醒创建成功' });
});

app.put('/api/renewals/:id', authenticateToken, (req, res) => {
  const { status, renewed_date, new_contract_end_date, notes, reminder_sent } = req.body;
  const fields = [];
  const values = [];

  if (status) {
    fields.push('status');
    values.push(status);
  }
  if (renewed_date) {
    fields.push('renewed_date');
    values.push(renewed_date);
  }
  if (new_contract_end_date) {
    fields.push('new_contract_end_date');
    values.push(new_contract_end_date);
  }
  if (notes !== undefined) {
    fields.push('notes');
    values.push(notes);
  }
  if (reminder_sent !== undefined) {
    fields.push('reminder_sent');
    fields.push('reminder_date');
    values.push(reminder_sent ? 1 : 0);
    values.push(reminder_sent ? new Date().toISOString() : null);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);

  db.prepare(`UPDATE renewals SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '续费记录更新成功' });
});

app.get('/api/todos', authenticateToken, (req, res) => {
  const { assignee_id, status } = req.query;
  let query = 'SELECT t.*, u.name as assignee_name FROM todos t LEFT JOIN users u ON t.assignee_id = u.id WHERE 1=1';
  const params = [];

  if (assignee_id) {
    query += ' AND t.assignee_id = ?';
    params.push(assignee_id);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC';
  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

app.post('/api/todos', authenticateToken, (req, res) => {
  const { type, related_id, title, description, assignee_id, priority, due_date } = req.body;
  const result = db.prepare(`
    INSERT INTO todos (type, related_id, title, description, assignee_id, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(type, related_id || null, title, description, assignee_id || null, priority || 'medium', due_date || null);

  res.json({ id: result.lastInsertRowid, message: '待办创建成功' });
});

app.put('/api/todos/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE todos SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: '待办状态更新成功' });
});

app.get('/api/users', authenticateToken, (req, res) => {
  const { role } = req.query;
  let query = 'SELECT id, username, name, role, phone, email, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  const users = db.prepare(query).all(...params);
  res.json(users);
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients WHERE status = "active"').get();
  const highRiskClients = db.prepare('SELECT COUNT(*) as count FROM clients WHERE risk_level = "high"').get();
  const pendingDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE status = "pending"').get();
  const pendingTax = db.prepare('SELECT COUNT(*) as count FROM tax_declarations WHERE status = "pending" OR status = "overdue"').get();
  const overdueTax = db.prepare('SELECT COUNT(*) as count FROM tax_declarations WHERE is_overdue = 1').get();
  const unreadReports = db.prepare('SELECT COUNT(*) as count FROM monthly_reports WHERE is_read = 0').get();
  const pendingRenewals = db.prepare('SELECT COUNT(*) as count FROM renewals WHERE status = "pending"').get();

  res.json({
    totalClients: totalClients.count,
    highRiskClients: highRiskClients.count,
    pendingDocs: pendingDocs.count,
    pendingTax: pendingTax.count,
    overdueTax: overdueTax.count,
    unreadReports: unreadReports.count,
    pendingRenewals: pendingRenewals.count
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
