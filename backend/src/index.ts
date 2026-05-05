import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/database';

// 导入路由
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import planRoutes from './routes/planRoutes';
import feedbackRoutes from './routes/feedbackRoutes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '22341');

// CORS 配置
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:12234';
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// 404 处理
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API 端点不存在',
  });
});

// 错误处理中间件
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    app.listen(PORT, () => {
      console.log('🚀 任务管理系统后端启动成功!');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌐 允许的前端地址: ${FRONTEND_URL}`);
      console.log('========================================');
      console.log('默认管理员账号: admin / admin123');
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
