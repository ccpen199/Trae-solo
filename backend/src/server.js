require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const initDatabase = require('./database/init');
const { authMiddleware, permissionMiddleware } = require('./middleware/auth');
const createAuthRouter = require('./routes/auth');
const createBidsRouter = require('./routes/bids');
const createLedgerRouter = require('./routes/ledger');
const createQualificationsRouter = require('./routes/qualifications');
const createExceptionsRouter = require('./routes/exceptions');
const createUsersRouter = require('./routes/users');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || true`, { encoding: 'utf8' }).trim();
    return result ? result.split('\n') : [];
  } catch (e) {
    return [];
  }
}

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || 53360);
const pids = checkPort(BACKEND_PORT);
if (pids.length > 0) {
  console.error(`端口 ${BACKEND_PORT} 已被占用 (PID: ${pids.join(', ')})`);
  console.error('请手动终止占用进程或调整.env中的端口配置');
  process.exit(1);
}

const db = initDatabase();
const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:43360', 'http://localhost:43360'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const auth = authMiddleware(db);
const requirePermission = permissionMiddleware;

app.use('/api/auth', createAuthRouter(db));
app.use('/api/bids', createBidsRouter(db, auth, requirePermission));
app.use('/api/ledger', createLedgerRouter(db, auth, requirePermission));
app.use('/api/qualifications', createQualificationsRouter(db, auth, requirePermission));
app.use('/api/exceptions', createExceptionsRouter(db, auth));
app.use('/api/users', createUsersRouter(db, auth));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`
=============================================
AI 招投标标书助手 - 后端服务启动成功
=============================================
服务地址: http://127.0.0.1:${BACKEND_PORT}
API 前缀:   /api
数据库:     ${path.resolve(dataDir, 'app.sqlite')}
启动时间:   ${new Date().toLocaleString()}
=============================================
测试账号:
  owner / 123456    (业务负责人)
  operator / 123456 (模型运营)
  reviewer / 123456 (审核人员)
  user / 123456     (一线使用者)
=============================================
  `);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
