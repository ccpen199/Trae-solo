import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import prisma from './config/database';
import { errorHandler, NotFoundError } from './middleware';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

let databaseConnected = false;

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

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '家具定制订单系统运行正常',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '家具定制订单系统运行正常',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected',
    services: {
      redis: 'running',
      server: 'running'
    }
  });
});

app.use('/api/v1', routes);

app.use('*', (req, res, next) => {
  next(new NotFoundError(`路径不存在: ${req.originalUrl}`));
});

app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('正在尝试连接数据库...');
    await prisma.$connect();
    databaseConnected = true;
    logger.info('✅ 数据库连接成功');
  } catch (error) {
    databaseConnected = false;
    logger.warn('⚠️ 数据库连接失败:', (error as Error).message);
    logger.warn('⚠️ 服务器将在无数据库模式下启动（部分功能可能不可用）');
    logger.info('💡 提示：如需完整功能，请确保 PostgreSQL 数据库已启动并配置正确的连接字符串');
  }

  try {
    app.listen(PORT, () => {
      logger.info('');
      logger.info('🚀 ========================================');
      logger.info('🚀  家具定制订单系统启动成功！');
      logger.info('🚀 ========================================');
      logger.info('');
      logger.info(`📌 服务器端口: ${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 数据库状态: ${databaseConnected ? '✅ 已连接' : '⚠️ 未连接'}`);
      logger.info('');
      logger.info('🔗 API 端点:');
      logger.info(`   - 健康检查: http://localhost:${PORT}/health`);
      logger.info(`   - API 根路径: http://localhost:${PORT}/api/v1`);
      logger.info(`   - 需求管理: http://localhost:${PORT}/api/v1/demands`);
      logger.info(`   - 订单管理: http://localhost:${PORT}/api/v1/orders`);
      logger.info(`   - 审计日志: http://localhost:${PORT}/api/v1/audit`);
      logger.info('');
    });
  } catch (error) {
    logger.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('');
  logger.info('📢 收到 SIGINT 信号，正在关闭服务器...');
  if (databaseConnected) {
    await prisma.$disconnect();
    logger.info('✅ 数据库连接已断开');
  }
  logger.info('👋 服务器已关闭，再见！');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('');
  logger.info('📢 收到 SIGTERM 信号，正在关闭服务器...');
  if (databaseConnected) {
    await prisma.$disconnect();
    logger.info('✅ 数据库连接已断开');
  }
  logger.info('👋 服务器已关闭，再见！');
  process.exit(0);
});

startServer();

export default app;
