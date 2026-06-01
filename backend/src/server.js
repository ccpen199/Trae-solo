const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const db = require('./database');

const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const HOST = '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || 56782);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 46782);
const SESSION_SECRET = process.env.SESSION_SECRET || 'antifraud-session-secret-86782';
const UPLOAD_DIR = path.join(projectRoot, 'data', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const hash = crypto.createHash('sha256').update(Date.now() + file.originalname).digest('hex').substring(0, 16);
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function getClientIp(req) {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  jwt.verify(token, SESSION_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '认证令牌无效' });
    }
    req.user = user;
    db.logAudit(user.id, 'api_access', req.path, null, getClientIp(req), req.headers['user-agent'], null);
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'antifraud-platform',
    database: db.info().path,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.post('/api/auth/login', (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    const user = db.login(username, password);
    if (!user) {
      db.logAudit(null, 'login_failed', 'auth', null, getClientIp(req), req.headers['user-agent'], JSON.stringify({ username }));
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign(user, SESSION_SECRET, { expiresIn: '24h' });
    db.logAudit(user.id, 'login_success', 'auth', null, getClientIp(req), req.headers['user-agent'], null);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  db.logAudit(req.user.id, 'logout', 'auth', null, getClientIp(req), req.headers['user-agent'], null);
  res.json({ status: 'ok' });
});

app.get('/api/overview', (req, res, next) => {
  try {
    res.json(db.getOverview());
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats', (req, res, next) => {
  try {
    res.json(db.getStats());
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports', (req, res, next) => {
  try {
    const { status, risk_level, page, pageSize } = req.query;
    const params = {
      status: status || null,
      risk_level: risk_level || null,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.listCases(params));
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports/:id', (req, res, next) => {
  try {
    const report = db.getCase(Number(req.params.id));
    if (!report) {
      return res.status(404).json({ error: '举报记录不存在' });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reports', (req, res, next) => {
  try {
    const created = db.createCase(req.body || {});
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.put('/api/reports/:id/status', authenticateToken, requireRole(['super_admin', 'admin', 'officer']), (req, res, next) => {
  try {
    const { status, note } = req.body;
    const updated = db.updateCaseStatus(
      Number(req.params.id),
      status,
      req.user.id,
      req.user.real_name || req.user.username,
      note || ''
    );
    if (!updated) {
      return res.status(404).json({ error: '举报记录不存在' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reports/:id/evidences', upload.array('files', 20), (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    const report = db.getCase(reportId);
    if (!report) {
      return res.status(404).json({ error: '举报记录不存在' });
    }
    const evidences = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
        const evidence = db.addEvidence(reportId, {
          type: req.body.type || file.mimetype || 'file',
          file_name: file.originalname,
          file_path: file.path,
          file_hash: fileHash,
          description: req.body.description || ''
        });
        evidences.push(evidence);
      }
    }
    res.status(201).json({ evidences });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verify', (req, res, next) => {
  try {
    const { type, value } = req.query;
    if (!type || !value) {
      return res.status(400).json({ error: '类型和值不能为空' });
    }
    const result = db.verifyResource(type, value, getClientIp(req));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/verify/batch', (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: '核验列表不能为空' });
    }
    const results = items.map(item => ({
      ...item,
      ...db.verifyResource(item.type, item.value, getClientIp(req))
    }));
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verify/history', authenticateToken, requireRole(['super_admin', 'admin', 'officer']), (req, res, next) => {
  try {
    const { page, pageSize } = req.query;
    const params = {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.listVerifications(params));
  } catch (error) {
    next(error);
  }
});

app.get('/api/fraud-resources', (req, res, next) => {
  try {
    const { type, risk_level, page, pageSize } = req.query;
    const params = {
      type: type || null,
      risk_level: risk_level || null,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.listFraudResources(params));
  } catch (error) {
    next(error);
  }
});

app.post('/api/fraud-resources', authenticateToken, requireRole(['super_admin', 'admin']), (req, res, next) => {
  try {
    const created = db.addFraudResource(req.body || {});
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.put('/api/fraud-resources/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res, next) => {
  try {
    const updated = db.updateFraudResource(Number(req.params.id), req.body || {});
    if (!updated) {
      return res.status(404).json({ error: '涉诈资源不存在' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.get('/api/agencies', (req, res, next) => {
  try {
    res.json(db.listAgencies());
  } catch (error) {
    next(error);
  }
});

app.get('/api/tasks', authenticateToken, (req, res, next) => {
  try {
    const { status, assignee_id, page, pageSize } = req.query;
    const params = {
      status: status || null,
      assignee_id: assignee_id ? Number(assignee_id) : null,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.listTasks(params));
  } catch (error) {
    next(error);
  }
});

app.post('/api/tasks', authenticateToken, requireRole(['super_admin', 'admin']), (req, res, next) => {
  try {
    const created = db.createTask(req.body || {});
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.put('/api/tasks/:id/status', authenticateToken, (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = db.updateTaskStatus(Number(req.params.id), status);
    if (!updated) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.put('/api/tasks/:id/assign', authenticateToken, requireRole(['super_admin', 'admin']), (req, res, next) => {
  try {
    const { assignee_id, assignee_name } = req.body;
    const updated = db.assignTask(Number(req.params.id), assignee_id, assignee_name);
    if (!updated) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.get('/api/knowledge-graph', (req, res, next) => {
  try {
    res.json(db.getKnowledgeGraph());
  } catch (error) {
    next(error);
  }
});

app.get('/api/warnings', (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    res.json(db.getPersonalizedWarnings(userId));
  } catch (error) {
    next(error);
  }
});

app.get('/api/quizzes', (req, res, next) => {
  try {
    const { tags, limit } = req.query;
    res.json(db.getQuizzes(tags || null, limit ? Number(limit) : 5));
  } catch (error) {
    next(error);
  }
});

app.post('/api/quizzes/:id/answer', (req, res, next) => {
  try {
    const { answer, user_id } = req.body;
    const result = db.submitQuizAnswer(Number(req.params.id), user_id || null, answer);
    if (!result) {
      return res.status(404).json({ error: '题目不存在' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/users', authenticateToken, requireRole(['super_admin']), (req, res, next) => {
  try {
    const { role } = req.query;
    res.json(db.listUsers(role || null));
  } catch (error) {
    next(error);
  }
});

app.get('/api/audit-logs', authenticateToken, requireRole(['super_admin']), (req, res, next) => {
  try {
    const { user_id, page, pageSize } = req.query;
    const params = {
      user_id: user_id ? Number(user_id) : null,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.getAuditLogs(params));
  } catch (error) {
    next(error);
  }
});

app.get('/api/operation-logs', authenticateToken, requireRole(['super_admin']), (req, res, next) => {
  try {
    const { table_name, page, pageSize } = req.query;
    const params = {
      table_name: table_name || null,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };
    res.json(db.getOperationLogs(params));
  } catch (error) {
    next(error);
  }
});

app.get('/api/cases', (req, res, next) => {
  try {
    const dbRaw = require('better-sqlite3')(path.join(projectRoot, 'data', 'app.sqlite'));
    const cases = dbRaw.prepare('SELECT * FROM cases ORDER BY created_at DESC').all();
    dbRaw.close();
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

app.post('/api/cases', authenticateToken, requireRole(['super_admin', 'admin']), (req, res, next) => {
  try {
    const { title, type, location, amount, risk_level, agency_id, tags } = req.body;
    const case_no = `AJ${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const dbRaw = require('better-sqlite3')(path.join(projectRoot, 'data', 'app.sqlite'));
    const info = dbRaw.prepare(`
      INSERT INTO cases (case_no, title, type, location, amount, risk_level, status, agency_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, '初筛中', ?, ?)
    `).run(case_no, title, type, location, amount || 0, risk_level || '中危', agency_id || null, tags || null);
    dbRaw.close();
    res.status(201).json({ id: info.lastInsertRowid, case_no, title, type, status: '初筛中' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports/by-region', (req, res, next) => {
  try {
    res.json(db.screenReportsByRegion());
  } catch (error) {
    next(error);
  }
});

app.get('/api/system-info', authenticateToken, requireRole(['super_admin']), (req, res) => {
  res.json({
    version: '1.0.0',
    encryption: 'AES-256-CBC',
    database: 'SQLite',
    security_level: '等保三级',
    apis: [
      { name: '110接警系统对接', status: '预留', description: '支持警情数据同步、案件移送' },
      { name: '银行风控系统对接', status: '预留', description: '支持账户查询、资金冻结、止付' },
      { name: '运营商数据对接', status: '预留', description: '支持通话记录、短信记录查询' }
    ]
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在', path: req.path });
});

app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: error.message || '服务器内部错误',
    errorCode: error.code || 'INTERNAL_ERROR'
  });
});

db.init();

const server = app.listen(PORT, HOST, () => {
  console.log(`backend listening on http://${HOST}:${PORT}`);
  console.log(`health check http://${HOST}:${PORT}/api/health`);
  console.log(`frontend origin: http://127.0.0.1:${FRONTEND_PORT}`);
});

server.on('error', (error) => {
  console.error(`backend failed: ${error.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => process.exit(0));
});
