import 'reflect-metadata';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { AppDataSource } from './config/database';
import { redisClient } from './config/redis';
import { authService } from './services/authService';

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import logisticsRoutes from './routes/logistics';

dotenv.config();

const PORT = parseInt(process.env.PORT || '12257');
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

const uploadsDir = path.join(__dirname, '../uploads');
const logsDir = path.join(__dirname, '../logs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: '请求过于频繁，请稍后再试'
}));
app.use(cors({
  origin: ['http://localhost:22571', 'http://127.0.0.1:22571'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '物流信息交互平台后端服务运行正常',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logistics', logisticsRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: NODE_ENV === 'development' ? err.message : undefined
  });
});

async function startServer() {
  try {
    console.log('正在初始化数据库连接...');
    await AppDataSource.initialize();
    console.log('数据库连接成功');

    console.log('正在初始化管理员账户...');
    await authService.createAdmin();

    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('  物流信息交互平台后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/health`);
      console.log(`  环境: ${NODE_ENV}`);
      console.log(`  端口: ${PORT}`);
      console.log('========================================\n');
      console.log('管理员账号: admin / admin123');
      console.log('\n可用API:');
      console.log('  POST /api/auth/login    - 登录');
      console.log('  POST /api/auth/register - 注册');
      console.log('  GET  /api/auth/me       - 获取当前用户');
      console.log('  PUT  /api/auth/profile  - 更新个人信息');
      console.log('');
      console.log('管理员API:');
      console.log('  GET  /api/admin/users/pending   - 未审核用户列表');
      console.log('  GET  /api/admin/users/approved  - 已审核用户列表');
      console.log('  POST /api/admin/users/:id/approve - 审核通过');
      console.log('  POST /api/admin/users/:id/reject  - 拒绝审核');
      console.log('  DELETE /api/admin/users/:id       - 删除用户');
      console.log('  GET  /api/admin/logistics         - 物流单列表');
      console.log('  POST /api/admin/logistics/export  - 导出物流单');
      console.log('  GET  /api/admin/logs              - 日志列表');
      console.log('  DELETE /api/admin/logs            - 批量删除日志');
      console.log('');
      console.log('企业用户API:');
      console.log('  POST /api/logistics/create       - 新增物流单');
      console.log('  POST /api/logistics/upload       - 上传Excel导入');
      console.log('  GET  /api/logistics/list/:category - 获取物流单列表');
      console.log('  GET  /api/logistics/detail/:id   - 获取物流单详情');
      console.log('  POST /api/logistics/export       - 导出物流单');
    });
  } catch (error: any) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
