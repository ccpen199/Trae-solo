import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import prisma from './lib/prisma';
import { redisService } from './lib/redis';

const app = express();

app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
}));

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = path.resolve(__dirname, '../../', config.upload.dir);
app.use('/uploads', express.static(uploadDir));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: '金种子酒业 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      news: '/api/news',
      products: '/api/products',
      dealer: '/api/dealer',
      health: '/api/health',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    console.log('='.repeat(50));
    console.log('金种子酒业后端服务启动中...');
    console.log('='.repeat(50));

    console.log('\n[1/4] 连接数据库...');
    await prisma.$connect();
    console.log('✓ 数据库连接成功');

    console.log('\n[2/4] 连接 Redis...');
    const redisConnected = await redisService.connect();
    if (redisConnected) {
      console.log('✓ Redis 连接成功');
    } else {
      console.log('⚠ Redis 未连接，使用内存缓存作为降级方案');
    }

    console.log('\n[3/4] 启动 HTTP 服务器...');
    const server = app.listen(config.port, () => {
      console.log(`✓ 服务器已启动，端口: ${config.port}`);
      console.log(`✓ 访问地址: http://localhost:${config.port}`);
      console.log(`✓ API 地址: http://localhost:${config.port}/api`);
      console.log(`✓ 环境: ${config.nodeEnv}`);
      console.log('\n' + '='.repeat(50));
      console.log('服务启动成功！');
      console.log('='.repeat(50));
    });

    const gracefulShutdown = async () => {
      console.log('\n正在优雅关闭服务...');
      
      server.close(() => {
        console.log('✓ HTTP 服务器已关闭');
      });

      await prisma.$disconnect();
      console.log('✓ 数据库连接已关闭');

      await redisService.disconnect();
      console.log('✓ Redis 连接已关闭');

      console.log('服务已完全关闭');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
