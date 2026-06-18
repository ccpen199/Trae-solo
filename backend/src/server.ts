import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, requestIdMiddleware } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import routes from './routes';
import { HealthCheckService } from './services/healthCheck';
import { DepartmentAdapterManager } from './adapters/DepartmentAdapterManager';
import { OrchestrationEngine } from './engines/OrchestrationEngine';
import { ProfileEngineService } from './engines/ProfileEngineService';
import { KnowledgeGraphEngine } from './engines/KnowledgeGraphEngine';
import { FeedbackAnalyticsEngine } from './engines/FeedbackAnalyticsEngine';
import { ScheduledTasks } from './services/scheduledTasks';

const app = express();
const PORT = config.port || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
  hsts: config.isProd
}));

app.use(cors({
  origin: config.isProd ? config.corsOrigins : true,
  credentials: true,
  maxAge: 86400
}));

app.use(compression({
  level: 6,
  threshold: 1024
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  },
  keyGenerator: (req) => {
    return (req.headers['x-forwarded-for'] as string) ||
           req.ip ||
           (req.headers.authorization?.substring(0, 50) || 'anonymous');
  }
});
app.use(limiter);

app.use(requestIdMiddleware);
app.use(morgan(config.isProd ? 'combined' : 'dev', {
  stream: { write: (message) => logger.http(message.trim()) }
}));
app.use(requestLogger);

app.get('/health', HealthCheckService.check);
app.get('/health/detailed', HealthCheckService.detailed);
app.get('/api/health', HealthCheckService.check);
app.get('/api/health/detailed', HealthCheckService.detailed);

app.use(config.apiPrefix, routes);

app.use(config.apiPrefix + '/protected', authMiddleware);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    logger.info('[Bootstrap] 正在启动郑州市政务服务后端服务...');
    logger.info(`[Bootstrap] 环境: ${config.nodeEnv}`);

    await DepartmentAdapterManager.initialize();
    logger.info(`[Bootstrap] 委办局适配器初始化完成，共 ${DepartmentAdapterManager.getAdapterCount()} 个`);

    OrchestrationEngine.initialize();
    logger.info('[Bootstrap] 服务编排引擎初始化完成');

    ProfileEngineService.initialize();
    logger.info('[Bootstrap] 市民画像引擎初始化完成');

    KnowledgeGraphEngine.initialize();
    logger.info('[Bootstrap] 政务知识图谱引擎初始化完成');

    FeedbackAnalyticsEngine.initialize();
    logger.info('[Bootstrap] 反馈聚类分析引擎初始化完成');

    ScheduledTasks.initialize();
    logger.info('[Bootstrap] 定时任务调度初始化完成');

    const server = app.listen(PORT, HOST, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           郑州市掌上办事中枢 - 后端服务启动成功              ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址:    http://${HOST}:${PORT}                         ║
║  API前缀:     ${config.apiPrefix}                              ║
║  健康检查:    http://${HOST}:${PORT}/api/health                  ║
║  API文档:     http://${HOST}:${PORT}${config.apiPrefix}/docs ║
║  启动时间:    ${new Date().toLocaleString('zh-CN')}                      ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = async (signal: string) => {
      logger.warn(`[Shutdown] 收到 ${signal} 信号，开始优雅关闭...`);
      server.close(async () => {
        try {
          await DepartmentAdapterManager.shutdown();
          ScheduledTasks.shutdown();
          logger.info('[Shutdown] 所有资源已释放，进程退出');
          process.exit(0);
        } catch (err) {
          logger.error('[Shutdown] 关闭过程出错:', err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('[Shutdown] 强制超时退出');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error('[UncaughtException] 未捕获异常:', err);
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[UnhandledRejection] 未处理Promise拒绝:', { reason, promise });
    });

  } catch (error) {
    logger.error('[Bootstrap] 服务启动失败:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
