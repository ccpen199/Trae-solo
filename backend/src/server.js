const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');

const { responseMiddleware } = require('./middleware/response');
const { checkAndAllocatePorts } = require('./utils/port');
const { initDatabase } = require('./db/init');

const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/card');
const transportRoutes = require('./routes/transport');
const lifeRoutes = require('./routes/life');
const pointsRoutes = require('./routes/points');
const adminRoutes = require('./routes/admin');

const projectDir = path.resolve(__dirname, '..', '..');

const { frontendPort, backendPort } = checkAndAllocatePorts(projectDir);

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${frontendPort}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(responseMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

initDatabase();

app.get('/api/health', (req, res) => {
  res.success({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    frontend_port: frontendPort,
    backend_port: backendPort
  }, '服务运行正常');
});

app.use('/api/auth', authRoutes);
app.use('/api/card', cardRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/life', lifeRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.error('接口不存在', 404);
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.error('服务器内部错误: ' + err.message, 500);
});

app.listen(backendPort, '127.0.0.1', () => {
  console.log('========================================');
  console.log('  成都市域一体化交通生活服务中台 - 后端');
  console.log('========================================');
  console.log(`  监听地址: http://127.0.0.1:${backendPort}`);
  console.log(`  前端地址: http://127.0.0.1:${frontendPort}`);
  console.log(`  健康检查: http://127.0.0.1:${backendPort}/api/health`);
  console.log(`  数据库: ${path.join(projectDir, 'data', 'app.sqlite')}`);
  console.log('========================================');
  console.log(`  启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});
