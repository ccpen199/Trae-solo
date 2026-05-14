const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const { initDatabase } = require('./database');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const barRoutes = require('./routes/bars');
const entryRoutes = require('./routes/entries');
const contentRoutes = require('./routes/contents');
const ownerRoutes = require('./routes/owners');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});
app.use('/api', limiter);

initDatabase();

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '淘宝产品吧后端服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bars: '/api/bars',
      entries: '/api/entries',
      contents: '/api/contents',
      owners: '/api/owners',
      categories: '/api/categories',
      admin: '/api/admin'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/bars', barRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`=================================`);
  logger.info(`淘宝产品吧后端服务已启动`);
  logger.info(`环境: ${config.nodeEnv}`);
  logger.info(`端口: ${config.port}`);
  logger.info(`地址: http://localhost:${config.port}`);
  logger.info(`=================================`);
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
});

module.exports = app;
