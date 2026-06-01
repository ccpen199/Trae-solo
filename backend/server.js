require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58877;
const JWT_SECRET = 'campus-safety-secret-key-2024';

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48877}`, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initDatabase();

function generateIncidentNo() {
  const date = new Date();
  const prefix = `INC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const stmt = db.prepare('SELECT MAX(incident_no) as max_no FROM incidents WHERE incident_no LIKE ?');
  const result = stmt.get(`${prefix}%`);
  let seq = 1;
  if (result.max_no) {
    seq = parseInt(result.max_no.slice(-4)) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function getDeadline(type, urgency) {
  const now = new Date();
  let hours = 24;
  if (urgency === 'critical') hours = 1;
  else if (urgency === 'high') hours = 4;
  else if (urgency === 'normal') hours = 24;
  else hours = 72;
  
  if (type === 'bullying') hours = Math.min(hours, 2);
  else if (type === 'injury') hours = Math.min(hours, 1);
  else if (type === 'food_safety') hours = Math.min(hours, 4);
  
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function getAssignedDepartment(type) {
  const depts = {
    bullying: 'student_affairs',
    injury: 'medical',
    food_safety: 'logistics',
    facility: 'logistics',
    security: 'security',
    other: 'general'
  };
  return depts[type] || 'general';
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权访问' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token 无效' });
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, department: user.department } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/incidents', (req, res) => {
  const { type, title, description, location, involved_persons, urgency, reporter_name, reporter_phone, is_anonymous, images, parent_incident_id } = req.body;
  
  const incident_no = generateIncidentNo();
  const assigned_department = getAssignedDepartment(type);
  const deadline = getDeadline(type, urgency);
  
  const stmt = db.prepare(`
    INSERT INTO incidents 
    (incident_no, type, title, description, location, involved_persons, urgency, reporter_name, reporter_phone, is_anonymous, images, assigned_department, deadline, parent_incident_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(incident_no, type, title, description, location, involved_persons, urgency, reporter_name, reporter_phone, is_anonymous ? 1 : 0, images, assigned_department, deadline, parent_incident_id, 'pending');
  
  if (urgency === 'critical') {
    const notifStmt = db.prepare('INSERT INTO notifications (title, content, incident_id) VALUES (?, ?, ?)');
    notifStmt.run(`紧急事件: ${title}`, description, result.lastInsertRowid);
  }
  
  const newIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid);
  res.json(newIncident);
});

app.get('/api/incidents', authenticateToken, (req, res) => {
  const { status, type, urgency, page = 1, pageSize = 20 } = req.query;
  let where = [];
  let params = [];
  
  if (status) { where.push('status = ?'); params.push(status); }
  if (type) { where.push('type = ?'); params.push(type); }
  if (urgency) { where.push('urgency = ?'); params.push(urgency); }
  
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (page - 1) * pageSize;
  
  const incidents = db.prepare(`SELECT * FROM incidents ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM incidents ${whereStr}`).get(...params).count;
  
  res.json({ incidents, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

app.get('/api/incidents/:id', authenticateToken, (req, res) => {
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
  if (!incident) return res.status(404).json({ error: '事件不存在' });
  
  const records = db.prepare('SELECT ir.*, u.name as creator_name FROM incident_records ir LEFT JOIN users u ON ir.created_by = u.id WHERE ir.incident_id = ? ORDER BY ir.created_at DESC').all(req.params.id);
  const collaborators = db.prepare('SELECT ic.*, u.name, u.role, u.department FROM incident_collaborators ic JOIN users u ON ic.user_id = u.id WHERE ic.incident_id = ?').all(req.params.id);
  const parentNotifications = db.prepare('SELECT * FROM parent_notifications WHERE incident_id = ? ORDER BY notified_at DESC').all(req.params.id);
  const medicalRecords = db.prepare('SELECT mr.*, u.name as creator_name FROM medical_records mr LEFT JOIN users u ON mr.created_by = u.id WHERE mr.incident_id = ? ORDER BY mr.created_at DESC').all(req.params.id);
  const review = db.prepare('SELECT * FROM reviews WHERE incident_id = ?').get(req.params.id);
  const relatedIncidents = db.prepare('SELECT * FROM incidents WHERE parent_incident_id = ? OR id = (SELECT parent_incident_id FROM incidents WHERE id = ?) ORDER BY created_at DESC').all(req.params.id, req.params.id);
  
  res.json({ ...incident, records, collaborators, parentNotifications, medicalRecords, review, relatedIncidents });
});

app.put('/api/incidents/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE incidents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  
  db.prepare('INSERT INTO incident_records (incident_id, record_type, content, created_by) VALUES (?, ?, ?, ?)').run(req.params.id, 'status', `状态变更为: ${status}`, req.user.id);
  
  res.json({ success: true });
});

app.post('/api/incidents/:id/records', authenticateToken, (req, res) => {
  const { record_type, content } = req.body;
  const stmt = db.prepare('INSERT INTO incident_records (incident_id, record_type, content, created_by) VALUES (?, ?, ?, ?)');
  const result = stmt.run(req.params.id, record_type, content, req.user.id);
  
  const record = db.prepare('SELECT ir.*, u.name as creator_name FROM incident_records ir LEFT JOIN users u ON ir.created_by = u.id WHERE ir.id = ?').get(result.lastInsertRowid);
  res.json(record);
});

app.post('/api/incidents/:id/collaborators', authenticateToken, (req, res) => {
  const { user_id, role } = req.body;
  try {
    db.prepare('INSERT INTO incident_collaborators (incident_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user_id, role);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: '该人员已添加' });
  }
});

app.post('/api/incidents/:id/parent-notifications', authenticateToken, (req, res) => {
  const { student_name, parent_name, parent_phone, notification_content } = req.body;
  const stmt = db.prepare('INSERT INTO parent_notifications (incident_id, student_name, parent_name, parent_phone, notification_content, notified_by) VALUES (?, ?, ?, ?, ?, ?)');
  const result = stmt.run(req.params.id, student_name, parent_name, parent_phone, notification_content, req.user.id);
  
  const notification = db.prepare('SELECT * FROM parent_notifications WHERE id = ?').get(result.lastInsertRowid);
  res.json(notification);
});

app.post('/api/incidents/:id/medical-records', authenticateToken, (req, res) => {
  const { patient_name, symptoms, diagnosis, treatment, medicines, notes } = req.body;
  const stmt = db.prepare('INSERT INTO medical_records (incident_id, patient_name, symptoms, diagnosis, treatment, medicines, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(req.params.id, patient_name, symptoms, diagnosis, treatment, medicines, notes, req.user.id);
  
  const record = db.prepare('SELECT mr.*, u.name as creator_name FROM medical_records mr LEFT JOIN users u ON mr.created_by = u.id WHERE mr.id = ?').get(result.lastInsertRowid);
  res.json(record);
});

app.post('/api/incidents/:id/reviews', authenticateToken, (req, res) => {
  const { cause_analysis, corrective_actions, responsible_person, follow_up_tasks, conclusion } = req.body;
  
  const existing = db.prepare('SELECT id FROM reviews WHERE incident_id = ?').get(req.params.id);
  let result;
  
  if (existing) {
    db.prepare('UPDATE reviews SET cause_analysis = ?, corrective_actions = ?, responsible_person = ?, follow_up_tasks = ?, conclusion = ? WHERE incident_id = ?').run(cause_analysis, corrective_actions, responsible_person, follow_up_tasks, conclusion, req.params.id);
    result = { lastInsertRowid: existing.id };
  } else {
    const stmt = db.prepare('INSERT INTO reviews (incident_id, cause_analysis, corrective_actions, responsible_person, follow_up_tasks, conclusion, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    result = stmt.run(req.params.id, cause_analysis, corrective_actions, responsible_person, follow_up_tasks, conclusion, req.user.id);
  }
  
  db.prepare('UPDATE incidents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('closed', req.params.id);
  
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.json(review);
});

app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, name, role, department, phone FROM users ORDER BY department, name').all();
  res.json(users);
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM incidents').get().count;
  const pending = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status = ?').get('pending').count;
  const processing = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status = ?').get('processing').count;
  const closed = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status = ?').get('closed').count;
  
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM incidents GROUP BY type').all();
  const byUrgency = db.prepare('SELECT urgency, COUNT(*) as count FROM incidents GROUP BY urgency').all();
  
  const recent = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10').all();
  
  const overdue = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status NOT IN (?) AND deadline < CURRENT_TIMESTAMP').get('closed').count;
  
  res.json({ total, pending, processing, closed, byType, byUrgency, recent, overdue });
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20').all();
  res.json(notifications);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});