const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { port, frontendUrl, nodeEnv } = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const lotteryRoutes = require('./routes/lotteryRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

dotenv.config();

const app = express();

const logger = {
  info: (...args) => console.log(`[INFO] [${new Date().toISOString()}]`, ...args),
  error: (...args) => console.error(`[ERROR] [${new Date().toISOString()}]`, ...args),
  warn: (...args) => console.warn(`[WARN] [${new Date().toISOString()}]`, ...args),
  debug: (...args) => {
    if (nodeEnv !== 'production') {
      console.log(`[DEBUG] [${new Date().toISOString()}]`, ...args);
    }
  },
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`[REQUEST] ${req.method} ${req.url} - ${req.ip || req.connection.remoteAddress}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[RESPONSE] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  res.on('close', () => {
    const duration = Date.now() - start;
    logger.info(`[CLOSED] ${req.method} ${req.url} - ${res.statusCode || 'unknown'} - ${duration}ms`);
  });
  
  next();
});

app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port,
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/points', pointsRoutes);

app.use(notFoundHandler);
app.use((err, req, res, next) => {
  logger.error('Request Error:', err.message || err);
  if (err.stack) {
    logger.debug('Error Stack:', err.stack);
  }
  errorHandler(err, req, res, next);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err.message);
  logger.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION at:', promise);
  logger.error('Reason:', reason);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

const server = app.listen(port, () => {
  logger.info('========================================');
  logger.info('  营销活动后端服务启动成功!');
  logger.info(`  服务地址: http://localhost:${port}`);
  logger.info(`  端口: ${port}`);
  logger.info(`  环境: ${nodeEnv || 'development'}`);
  logger.info('========================================');
  logger.info('API 文档:');
  logger.info('  - 认证: POST /api/auth/register, POST /api/auth/login');
  logger.info('  - 活动: GET /api/activities/active/wheel, GET /api/activities/active/egg');
  logger.info('  - 抽奖: POST /api/lottery/wheel, POST /api/lottery/egg');
  logger.info('  - 积分: GET /api/points/balance, GET /api/points/transactions');
  logger.info('========================================');
});

server.on('error', (err) => {
  logger.error('Server error:', err);
});

module.exports = app;
