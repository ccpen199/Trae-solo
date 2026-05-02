require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
const PORT = parseInt(process.env.PORT) || 111321;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:111322',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '会计记账系统 API 服务',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      subjects: 'GET /api/subjects',
      vouchers: 'GET /api/vouchers, POST /api/vouchers',
      reports: 'GET /api/reports/balance-sheet/:period, GET /api/reports/profit-sheet/:period',
      dashboard: 'GET /api/dashboard/stats'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  会计记账系统后端服务已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  API 基础路径: http://localhost:${PORT}/api`);
  console.log(`========================================`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});
