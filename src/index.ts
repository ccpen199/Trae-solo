import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import prisma from './config/database';
import { errorHandler, NotFoundError } from './middleware';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});

app.use((req, res, next) => {
  (req as any).user = {
    id: 'test-user-id',
    role: 'ADMIN',
    name: 'Test User'
  };
  next();
});

app.use('/api/v1', routes);

app.use('*', (req, res, next) => {
  next(new NotFoundError(`路径不存在: ${req.originalUrl}`));
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('数据库连接成功');

    app.listen(PORT, () => {
      logger.info(`服务器启动成功，端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API 端点: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  await prisma.$disconnect();
  logger.info('数据库连接已断开');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  await prisma.$disconnect();
  logger.info('数据库连接已断开');
  process.exit(0);
});

startServer();

export default app;
