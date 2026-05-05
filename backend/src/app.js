const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PORT, FRONTEND_URL } = require('./config');
const { errorHandler, NotFoundError } = require('./middleware/errorHandler');
const routes = require('./routes');
const { sequelize } = require('./models');
const redisClient = require('./config/redis');

const app = express();

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:22264', 'http://127.0.0.1:22264'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', routes);

app.use((req, res, next) => {
  next(new NotFoundError(`路径 ${req.method} ${req.path} 不存在`));
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ alter: true });
    console.log('数据库模型同步完成');

    try {
      await redisClient.connect();
      console.log('Redis 连接成功');
    } catch (redisError) {
      console.warn('Redis 连接失败，使用降级模式运行:', redisError.message);
    }

    const server = app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  蚂蚁短租后端服务启动成功!`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });

    process.on('SIGTERM', async () => {
      console.log('收到 SIGTERM 信号，正在关闭服务器...');
      await sequelize.close();
      try {
        await redisClient.quit();
      } catch (e) {}
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('收到 SIGINT 信号，正在关闭服务器...');
      await sequelize.close();
      try {
        await redisClient.quit();
      } catch (e) {}
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
