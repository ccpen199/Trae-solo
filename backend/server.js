require('dotenv').config();
const express = require('express');
const path = require('path');

const { sequelize } = require('./src/models');
const corsMiddleware = require('./src/middleware/cors');
const { authMiddleware } = require('./src/middleware/auth');
const routes = require('./src/routes');
const seedDatabase = require('./src/config/seed');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 59010;
const HOST = process.env.HOST || '127.0.0.1';

app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(authMiddleware);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    message: '3C Repair O2O Platform API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    await sequelize.sync({ force: true });
    logger.info('数据库表创建成功');

    await seedDatabase();
    
    app.listen(PORT, HOST, () => {
      logger.info(`服务器运行在 http://${HOST}:${PORT}`);
      logger.info(`健康检查: http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('服务器启动失败', error);
    process.exit(1);
  }
}

startServer();
