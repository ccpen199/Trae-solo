const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const { connectRedis } = require('./config/redis');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const permissionRoutes = require('./routes/permission');
const logRoutes = require('./routes/log');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 12251;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api', limiter);

const corsOptions = {
  origin: ['http://localhost:22251', 'http://127.0.0.1:22251'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/system', systemRoutes);

app.use((err, req, res, next) => {
  logger.error('未处理的错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`========================================`);
      logger.info(`  RBAC权限管理系统后端服务已启动`);
      logger.info(`  服务地址: http://localhost:${PORT}`);
      logger.info(`  环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
