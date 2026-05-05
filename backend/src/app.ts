import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';

import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import resourceRoutes from './routes/resourceRoutes';
import questionRoutes from './routes/questionRoutes';
import testRoutes from './routes/testRoutes';
import jobRoutes from './routes/jobRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 12246;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22246';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:22246'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '智汇教育后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用智汇教育API',
    endpoints: {
      users: '/api/users',
      courses: '/api/courses',
      resources: '/api/resources',
      questions: '/api/questions',
      tests: '/api/tests',
      jobs: '/api/jobs'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/jobs', jobRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  智汇教育后端服务已启动`);
      console.log(`========================================`);
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
