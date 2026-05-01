import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, permissionMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, buildPagination, SmsTemplate, ComplianceCheckResult } from '@sms-platform/shared';
import * as net from 'net';
import { authRouter } from './routes/auth';
import { templateRouter } from './routes/templates';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.use('/api/auth', authRouter);
app.use('/api/templates', authMiddleware, templateRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'template-service',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(preferredPort: number, fallbackRange: number[] = [9830, 9840]): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  for (let port = fallbackRange[0]; port <= fallbackRange[1]; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }

  const randomPort = Math.floor(Math.random() * 10000) + 51000;
  if (await isPortAvailable(randomPort)) {
    return randomPort;
  }

  return 0;
}

async function startServer() {
  const preferredPort = config.services.template.port;
  const actualPort = await findAvailablePort(preferredPort);

  if (actualPort === 0) {
    logger.error('无法找到可用的端口，请检查网络配置');
    process.exit(1);
  }

  if (actualPort !== preferredPort) {
    logger.warn(`端口 ${preferredPort} 已被占用，自动切换到端口 ${actualPort}`);
  }

  app.listen(actualPort, () => {
    logger.info(`=================================================`);
    logger.info(`  模板服务启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`  环境: ${config.env}`);
    logger.info(`  启动时间: ${new Date().toISOString()}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务...');
  process.exit(0);
});
