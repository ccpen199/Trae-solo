require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const usersRouter = require('./routes/users');
const paymentsRouter = require('./routes/payments');
const transfersRouter = require('./routes/transfers');
const adminRouter = require('./routes/admin');

const PORT = process.env.PORT || 11087;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 11088;

const app = express();

const corsOptions = {
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: 'Digital Wallet System',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      payments: '/api/payments',
      transfers: '/api/transfers',
      admin: '/api/admin'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/users', usersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalPath
  });
});

const ensureDataDirectory = () => {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }
};

const initializeDatabase = async () => {
  try {
    ensureDataDirectory();
    const db = require('./database');
    try {
      const testResult = db.db.prepare('SELECT 1 as test').get();
      console.log('Database connection test passed');
    } catch (err) {
      console.log('Database not initialized, running init script...');
      const { spawn } = require('child_process');
      const initProcess = spawn('node', [path.join(__dirname, 'database', 'init.js')], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      await new Promise((resolve) => {
        initProcess.on('close', resolve);
      });
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              数字钱包系统后端服务                             ║
║  Digital Wallet System Backend Service                      ║
╠════════════════════════════════════════════════════════════╣
║  服务状态: 运行中                                            ║
║  访问地址: http://localhost:${PORT}                         ║
║  健康检查: http://localhost:${PORT}/health                   ║
║  API 文档: http://localhost:${PORT}/                         ║
╠════════════════════════════════════════════════════════════╣
║  前端端口: ${FRONTEND_PORT}                                  ║
║  数据库: SQLite (./data/app.sqlite)                         ║
╠════════════════════════════════════════════════════════════╣
║  模块说明:                                                    ║
║  - Ledger-Kernel: 复式记账账本引擎                           ║
║  - Anti-Fraud: 反欺诈引擎                                    ║
║  - Currency-Convert: 汇率引擎                                ║
║  - AML-Monitor: 反洗钱监测引擎                               ║
║  - HashChain: 哈希链保护与审计                               ║
╠════════════════════════════════════════════════════════════╣
║  功能模块:                                                    ║
║  - 用户模块: 注册、登录、实名激活                            ║
║  - 支付模块: 扫码消费、复式记账、反欺诈检测                  ║
║  - 转账模块: 账户一致性检查、电子凭证推送                    ║
║  - 财务模块: 日结对账、调账池                                 ║
║  - 监控模块: 日限额监控、异常频次监控                         ║
║  - 管理后台: 进度、质量、风险监控                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  await initializeDatabase();
});

module.exports = app;
