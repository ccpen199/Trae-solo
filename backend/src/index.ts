import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './database.js';
import runSeeder from './seeders/index.js';
import { errorHandler, successResponse } from './utils/common.js';

import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import certificateRoutes from './routes/certificates.js';
import sceneRoutes from './routes/scenes.js';
import feedbackRoutes from './routes/feedback.js';
import communityRoutes from './routes/community.js';
import busRoutes from './routes/bus.js';
import venueRoutes from './routes/venues.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 59101;
const HOST = process.env.BIND_HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49101';
const allowedOrigins = new Set([
  CORS_ORIGIN,
  CORS_ORIGIN.replace('127.0.0.1', 'localhost'),
  `http://127.0.0.1:${process.env.FRONTEND_PORT || 49101}`,
  `http://localhost:${process.env.FRONTEND_PORT || 49101}`
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    version: '1.0.0'
  }, '服务运行正常');
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => {
  return res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now()
  });
});

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  常州市公共服务聚合平台 - 后端服务                        ║
║                                                          ║
║  服务地址: http://${HOST}:${PORT}                        ║
║  CORS 来源: ${CORS_ORIGIN}                              ║
║  数据库: SQLite (better-sqlite3)                        ║
║  数据路径: ${path.join(__dirname, '../../data/app.sqlite')} ║
║                                                          ║
║  启动时间: ${new Date().toLocaleString('zh-CN')}        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);

  console.log('正在初始化数据...');
  runSeeder();

  console.log(`
✅ 服务启动完成！

📋 测试账号:
   管理员: admin / admin123456
   测试用户: 13800138000 / 123456

🔗 健康检查: GET http://${HOST}:${PORT}/api/health

📚 API 文档:
   认证相关   /api/auth/*
   服务相关   /api/services/*
   证照相关   /api/certificates/*
   场景相关   /api/scenes/*
   反馈相关   /api/feedback/*
   社区相关   /api/community/*
   公交相关   /api/bus/*
   场馆相关   /api/venues/*
   数据分析   /api/analytics/*
  `);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务...');
  db.close();
  console.log('服务已关闭');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务...');
  db.close();
  console.log('服务已关闭');
  process.exit(0);
});

export default app;
