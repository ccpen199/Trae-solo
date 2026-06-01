require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 56336;

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim();
    return result ? result.split('\n') : [];
  } catch (e) {
    return [];
  }
}

const occupied = checkPort(BACKEND_PORT);
if (occupied.length > 0) {
  console.error(`端口 ${BACKEND_PORT} 已被占用 (PID: ${occupied.join(', ')})`);
  console.error('请检查并释放端口，或修改 .env 文件中的 BACKEND_PORT');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const assessmentRoutes = require('./routes/assessments');
const taskRoutes = require('./routes/tasks');
const configRoutes = require('./routes/config');
const statsRoutes = require('./routes/statistics');
const logRoutes = require('./routes/logs');

const app = express();

const allowedOrigins = [
  'http://127.0.0.1:46336',
  'http://127.0.0.1:47336',
  'http://127.0.0.1:48336',
  'http://127.0.0.1:49336',
  'http://127.0.0.1:50336',
  'http://127.0.0.1:51336'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/config', configRoutes);
app.use('/api/statistics', statsRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   AI 客户流失预警 Agent - 后端服务                          ║
║                                                            ║
║   服务地址: http://127.0.0.1:${BACKEND_PORT}                   ║
║   API 前缀:  /api                                           ║
║   数据库:   SQLite (data/app.sqlite)                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
