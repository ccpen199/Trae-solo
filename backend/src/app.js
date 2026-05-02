require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 11088;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11089';

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('初始化数据库连接...');
require('./database/connection').getDb();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'risk-control-engine-backend',
    port: PORT
  });
});

const rulesRouter = require('./routes/rules');
const variablesRouter = require('./routes/variables');
const decisionRouter = require('./routes/decision');
const reviewRouter = require('./routes/review');
const backtestRouter = require('./routes/backtest');
const auditRouter = require('./routes/audit');

app.use('/api/rules', rulesRouter);
app.use('/api/variables', variablesRouter);
app.use('/api/decision', decisionRouter);
app.use('/api/review', reviewRouter);
app.use('/api/backtest', backtestRouter);
app.use('/api/audit', auditRouter);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    error: '服务器内部错误',
    message: err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API 路径不存在',
    path: req.path 
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           企业风控中台 - 后端服务启动成功                    ║
╠══════════════════════════════════════════════════════════╣
║  服务地址:  http://localhost:${PORT}                          ║
║  前端地址:  ${FRONTEND_URL}                             ║
║  数据库:    SQLite (data/app.sqlite)                       ║
╠══════════════════════════════════════════════════════════╣
║  核心引擎:                                                  ║
║    ✅ Rule-Tree 规则引擎                                    ║
║    ✅ Variable-Factory 特征引擎                             ║
║    ✅ Action-Handler 处置引擎                               ║
║    ✅ Backtest-Simulator 回测引擎                           ║
╠══════════════════════════════════════════════════════════╣
║  API 端点:                                                  ║
║    GET  /api/health           - 健康检查                    ║
║    GET  /api/rules            - 规则列表                    ║
║    GET  /api/variables        - 变量列表                    ║
║    POST /api/decision/evaluate - 执行决策                    ║
║    GET  /api/review/pending   - 待审核任务                  ║
║    GET  /api/backtest         - 回测任务                    ║
║    GET  /api/audit            - 审计日志                    ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
