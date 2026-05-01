import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import reportRoutes from './routes/reports';
import moderationRoutes from './routes/moderation';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

app.get('/api/health', async (req, res) => {
  const health: any = {
    status: 'starting',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (e: any) {
    health.database = 'disconnected';
    health.databaseError = e.message;
  }

  try {
    await redis.ping();
    health.redis = 'connected';
  } catch (e: any) {
    health.redis = 'using_memory_cache';
  }

  const isHealthy = health.database === 'connected';
  health.status = isHealthy ? 'healthy' : 'degraded';

  res.status(isHealthy ? 200 : 200).json({
    success: true,
    data: health
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '社区论坛系统 API',
      version: '1.0.0',
      endpoints: [
        '/api/auth - 认证',
        '/api/posts - 帖子',
        '/api/comments - 评论',
        '/api/reports - 举报',
        '/api/moderation - 审核',
        '/api/admin - 管理'
      ],
      health: '/api/health'
    }
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '数据验证失败',
      details: err.errors
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: '数据已存在'
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '资源不存在'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'production' ? '服务器内部错误' : err.message
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their channel`);
  });

  socket.on('leave', (userId: string) => {
    socket.leave(`user:${userId}`);
    console.log(`User ${userId} left their channel`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const startServer = async () => {
  console.log('====================================');
  console.log('  社区论坛系统 - 后端服务');
  console.log('====================================');
  console.log('');
  console.log('正在启动服务...');
  console.log(`端口: ${config.server.port}`);
  console.log(`环境: ${config.server.nodeEnv}`);
  console.log('');

  try {
    console.log('正在连接数据库...');
    await prisma.$connect();
    console.log('✓ 数据库连接成功');
  } catch (error: any) {
    console.log('✗ 数据库连接失败:', error.message);
    console.log('');
    console.log('提示: 请确保数据库已配置并运行。');
    console.log('运行以下命令来设置数据库:');
    console.log('  1. cd backend');
    console.log('  2. npx prisma generate');
    console.log('  3. npx prisma db push');
    console.log('  4. npx prisma db seed (可选: 初始化测试数据)');
    console.log('');
  }

  try {
    console.log('正在检查缓存服务...');
    await redis.ping();
    console.log('✓ 缓存服务就绪');
  } catch (error: any) {
    console.log('ℹ  使用内存缓存替代 Redis');
  }

  server.listen(config.server.port, config.server.host, () => {
    console.log('');
    console.log('====================================');
    console.log('  服务启动成功!');
    console.log('====================================');
    console.log('');
    console.log(`API 地址: http://localhost:${config.server.port}`);
    console.log(`健康检查: http://localhost:${config.server.port}/api/health`);
    console.log('');
    console.log('前端代理配置:');
    console.log(`  VITE_API_URL=http://localhost:${config.server.port}`);
    console.log('');
  });
};

process.on('SIGTERM', async () => {
  console.log('');
  console.log('SIGTERM received, shutting down gracefully');
  
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (e) {}
  
  try {
    await redis.disconnect();
    console.log('Redis disconnected');
  } catch (e) {}
  
  server.close();
  
  console.log('Server stopped');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('');
  console.log('SIGINT received, shutting down gracefully');
  
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (e) {}
  
  try {
    await redis.disconnect();
    console.log('Redis disconnected');
  } catch (e) {}
  
  server.close();
  
  console.log('Server stopped');
  process.exit(0);
});

export { io };

startServer();
