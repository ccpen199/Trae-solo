const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { db, initDatabase } = require('./database');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '53437');
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || '43437'}`,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function logOperation(userId, module, action, recordId, content, ip) {
  try {
    db.prepare(`
      INSERT INTO operation_logs (user_id, module, action, record_id, content, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, module, action, recordId, content, ip);
  } catch (e) {
    console.error('Log operation error:', e);
  }
}

app.use((req, res, next) => {
  req.db = db;
  req.logOperation = (userId, module, action, recordId, content) => {
    logOperation(userId, module, action, recordId, content, req.ip);
  };
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/dict/disasters', (req, res) => {
  const data = db.prepare('SELECT * FROM disaster_types ORDER BY code').all();
  res.json(data);
});

app.get('/api/dict/crops', (req, res) => {
  const data = db.prepare('SELECT * FROM crop_types ORDER BY code').all();
  res.json(data);
});

app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, username, name, role, phone, address FROM users WHERE 1=1';
  const params = [];
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id';
  const data = db.prepare(sql).all(...params);
  res.json(data);
});

app.get('/api/users/:id', (req, res) => {
  const data = db.prepare('SELECT id, username, name, role, phone, id_card, address FROM users WHERE id = ?').get(req.params.id);
  if (!data) return res.status(404).json({ error: '用户不存在' });
  res.json(data);
});

app.get('/api/farmers', (req, res) => {
  const data = db.prepare(`
    SELECT f.*, u.username, u.role 
    FROM farmers f 
    LEFT JOIN users u ON f.user_id = u.id 
    ORDER BY f.id DESC
  `).all();
  res.json(data);
});

app.get('/api/farmers/:id', (req, res) => {
  const data = db.prepare(`
    SELECT f.*, u.username, u.role 
    FROM farmers f 
    LEFT JOIN users u ON f.user_id = u.id 
    WHERE f.id = ?
  `).get(req.params.id);
  if (!data) return res.status(404).json({ error: '农户不存在' });
  res.json(data);
});

const policyRoutes = require('./routes/policies');
const reportRoutes = require('./routes/reports');
const surveyRoutes = require('./routes/surveys');
const claimRoutes = require('./routes/claims');
const statsRoutes = require('./routes/stats');

app.use('/api/policies', policyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/logs', (req, res) => {
  const { limit = 100, offset = 0, module, user_id } = req.query;
  let sql = `
    SELECT ol.*, u.name as user_name, u.role as user_role
    FROM operation_logs ol 
    LEFT JOIN users u ON ol.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];
  if (module) {
    sql += ' AND ol.module = ?';
    params.push(module);
  }
  if (user_id) {
    sql += ' AND ol.user_id = ?';
    params.push(user_id);
  }
  sql += ' ORDER BY ol.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const data = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count;
  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

initDatabase();

const server = app.listen(PORT, HOST, () => {
  console.log(`Crop Insurance Backend Server running at http://${HOST}:${PORT}`);
  console.log(`API Base URL: http://${HOST}:${PORT}/api`);
  console.log(`Health Check: http://${HOST}:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGHUP', () => {
  console.log('SIGHUP received, keeping server running');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
