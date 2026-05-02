import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, RARE_PORTS } from './config';
import { checkPortAndValidate } from './utils/port-check';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import logger from './utils/logger';

import authRouter from './routes/auth';
import schedulesRouter from './routes/schedules';
import enrollmentsRouter from './routes/enrollments';
import attendancesRouter from './routes/attendances';
import notificationsRouter from './routes/notifications';
import reportsRouter from './routes/reports';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.isDevelopment ? '*' : [
    'http://localhost:3000',
    'http://localhost:5173',
    /\.trae\.cn$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());

app.use(morgan(config.isDevelopment ? 'dev' : 'combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const publicPath = path.join(__dirname, '..', 'public');
app.use('/static', express.static(path.join(publicPath, 'static')));

app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

app.get('/login.html', (_req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/dashboard.html', (_req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
    },
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'edu-timetable-system',
      timestamp: new Date().toISOString(),
    },
  });
});

const apiPrefix = config.apiPrefix;

app.use(`${apiPrefix}/auth`, authRouter);
app.use(`${apiPrefix}/schedules`, schedulesRouter);
app.use(`${apiPrefix}/enrollments`, enrollmentsRouter);
app.use(`${apiPrefix}/attendances`, attendancesRouter);
app.use(`${apiPrefix}/notifications`, notificationsRouter);
app.use(`${apiPrefix}/reports`, reportsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    logger.info('========================================');
    logger.info('  教培机构排课系统 - 服务启动中');
    logger.info('========================================');
    logger.info(`环境: ${config.env}`);
    logger.info(`API前缀: ${apiPrefix}`);

    const finalPort = await checkPortAndValidate(config.port);

    const server = app.listen(finalPort, () => {
      logger.info('========================================');
      logger.info(`  ✅ 服务启动成功!`);
      logger.info(`  📍 监听端口: ${finalPort}`);
      logger.info(`  🌐 API地址: http://localhost:${finalPort}${apiPrefix}`);
      logger.info(`  💊 健康检查: http://localhost:${finalPort}/health`);
      logger.info('========================================');
      logger.info('默认测试账号:');
      logger.info('- 管理员: admin / 123456');
      logger.info('- 教师: teacher01 / 123456');
      logger.info('- 学生: student01 / 123456');
      logger.info('========================================');
    });

    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，优雅关闭服务...');
      server.close(() => {
        logger.info('服务已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，优雅关闭服务...');
      server.close(() => {
        logger.info('服务已关闭');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise,
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', {
        message: error.message,
        stack: error.stack,
      });
    });

  } catch (error) {
    logger.error('服务启动失败', {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

startServer();

export default app;
