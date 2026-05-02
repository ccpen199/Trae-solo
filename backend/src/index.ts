import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import logger from './utils/logger';
import prisma from './utils/prisma';

import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import paymentRoutes from './routes/payments';
import reconciliationRoutes from './routes/reconciliation';
import forecastRoutes from './routes/forecast';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [env.FRONTEND_URL, `http://localhost:${env.FRONTEND_PORT}`],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bank-management-backend',
      version: '1.0.0',
    },
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(env.BACKEND_PORT, () => {
      logger.info(`Server is running on port ${env.BACKEND_PORT}`);
      logger.info(`Backend URL: http://localhost:${env.BACKEND_PORT}`);
      console.log(`\n========================================`);
      console.log(`  银行账户管理系统 - 后端服务启动成功`);
      console.log(`========================================`);
      console.log(`  访问地址: http://localhost:${env.BACKEND_PORT}`);
      console.log(`  健康检查: http://localhost:${env.BACKEND_PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error as Error });
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
