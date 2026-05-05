require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const AuthService = require('./services/auth.service');
const UserService = require('./services/user.service');
const AuditLogService = require('./services/auditLog.service');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', routes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

async function initializeApp() {
  await Promise.all([
    AuthService.checkPrismaAvailable(),
    UserService.checkPrismaAvailable(),
    AuditLogService.checkPrismaAvailable()
  ]);
  
  app.listen(config.port, () => {
    logger.info(`=========================================`);
    logger.info(`  后端服务已启动`);
    logger.info(`  运行环境: ${config.nodeEnv}`);
    logger.info(`  访问地址: http://localhost:${config.port}`);
    logger.info(`  API地址: http://localhost:${config.port}/api`);
    logger.info(`=========================================`);
    logger.info(`  默认登录账户:`);
    logger.info(`  管理员: admin / admin123`);
    logger.info(`  测试用户: test / 123456`);
    logger.info(`=========================================`);
  });
}

initializeApp();

module.exports = app;
