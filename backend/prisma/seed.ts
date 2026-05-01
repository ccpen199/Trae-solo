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
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: '服务不可用'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

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
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    await redis.ping();
    console.log('Redis connected successfully');

    server.listen(config.server.port, config.server.host, () => {
      console.log(`Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redis.disconnect();
  server.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redis.disconnect();
  server.close();
  
  process.exit(0);
});

export { io };

startServer();
