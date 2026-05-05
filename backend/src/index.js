import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/auth.middleware.js';

import collisionRoutes from './routes/collision.routes.js';
import adminRoutes from './routes/admin.routes.js';
import mockRoutes from './routes/mock.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const logsDir = path.join(__dirname, '../logs');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  logger.info('Created data directory');
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  logger.info('Created logs directory');
}

const app = express();

app.use(cors({
  origin: ['http://localhost:30789', 'http://127.0.0.1:30789'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.version,
    environment: config.env
  });
});

app.use('/api/collision', collisionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/mock', mockRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

const PORT = config.port || 20789;

app.listen(PORT, () => {
  logger.info(`========================================`);
  logger.info(`  渠道撞库联登系统后端服务启动成功`);
  logger.info(`  环境: ${config.env}`);
  logger.info(`  端口: ${PORT}`);
  logger.info(`  时间: ${new Date().toLocaleString()}`);
  logger.info(`========================================`);
  logger.info(`  API 地址:`);
  logger.info(`  - 健康检查: http://localhost:${PORT}/health`);
  logger.info(`  - 撞库接口: http://localhost:${PORT}/api/collision`);
  logger.info(`  - 管理接口: http://localhost:${PORT}/api/admin`);
  logger.info(`  - 模拟接口: http://localhost:${PORT}/mock`);
  logger.info(`========================================`);
  
  console.log(`\n========================================`);
  console.log(`  后端服务已启动: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

export default app;
