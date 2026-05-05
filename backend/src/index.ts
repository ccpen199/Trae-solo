import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { redisService } from './lib/redis';
import { errorHandler, ApiError } from './middleware/errorHandler';
import { rateLimitMiddleware, apiCallLogging } from './middleware/rateLimit';
import { developersRouter } from './routes/developers';
import { applicationsRouter } from './routes/applications';
import { permissionsRouter } from './routes/permissions';
import { notificationsRouter } from './routes/notifications';

const app = express();
const API_PREFIX = config.apiGateway.prefix;

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Key', 'X-Request-Id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(apiCallLogging);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: config.nodeEnv
    }
  });
});

app.use(rateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 100
}));

app.use(`${API_PREFIX}/developers`, developersRouter);
app.use(`${API_PREFIX}/applications`, applicationsRouter);
app.use(`${API_PREFIX}/permissions`, permissionsRouter);
app.use(`${API_PREFIX}/notifications`, notificationsRouter);

app.all('*', (req: Request, res: Response) => {
  throw ApiError.notFound(`路径 ${req.method} ${req.path} 不存在`);
});

app.use(errorHandler);

async function startServer() {
  try {
    console.log('正在初始化服务...');
    
    try {
      await redisService.connect();
      console.log('Redis连接成功');
    } catch (error) {
      console.warn('Redis连接失败，将在降级模式下运行:', error);
    }

    const port = config.port;
    app.listen(port, () => {
      console.log('========================================');
      console.log('  淘宝接入平台TIP开放平台治理系统');
      console.log('========================================');
      console.log(`  后端服务已启动: http://localhost:${port}`);
      console.log(`  API前缀: ${API_PREFIX}`);
      console.log(`  环境: ${config.nodeEnv}`);
      console.log('========================================');
    });

  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭服务...');
  await redisService.disconnect();
  process.exit(0);
});

startServer();
