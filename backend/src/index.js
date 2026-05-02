require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 12132;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22132';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:22132', 'http://127.0.0.1:22132'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-User-UUID', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'game-task-achievement-service',
    status: 'healthy'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '游戏任务与成就系统',
      version: '1.0.0',
      description: '完整的游戏任务与成就管理系统，包含角色工作台、状态机、审计日志和报表分析',
      port: PORT,
      database: 'SQLite',
      dbPath: path.resolve(process.env.DB_PATH || './data/app.sqlite')
    }
  });
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  游戏任务与成就系统后端服务');
  console.log('========================================');
  console.log(`服务已启动: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API 信息: http://localhost:${PORT}/api/info`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log('========================================');
});

module.exports = app;
