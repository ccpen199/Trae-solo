import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase, getDb } from './database';
import { generateRequestId, corsHandler, apiGatewayLogger } from './middleware/auth';
import { successResponse, errorResponse } from './utils/response';

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import licenseRoutes from './routes/license';
import matterRoutes from './routes/matter';
import messageRoutes from './routes/message';
import recommendRoutes from './routes/recommend';
import crossProvinceRoutes from './routes/crossProvince';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 59098;
const HOST = process.env.HOST || '127.0.0.1';

app.use(generateRequestId);
app.use(corsHandler);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiGatewayLogger);

initDatabase();

app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as health').get();
    return successResponse(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
      database: result ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage() as any,
    });
  } catch (err) {
    return errorResponse(res, '服务异常', 503);
  }
});

app.get('/api', (req, res) => {
  return successResponse(res, {
    name: '江苏省人社一体化移动服务平台',
    version: '1.0.0',
    description: '标准化业务接口网关',
    basePath: '/api',
    modules: [
      { name: '认证服务', path: '/auth', endpoints: 9 },
      { name: '用户服务', path: '/user', endpoints: 9 },
      { name: '证照服务', path: '/license', endpoints: 14 },
      { name: '办件服务', path: '/matter', endpoints: 7 },
      { name: '消息服务', path: '/message', endpoints: 9 },
      { name: '推荐服务', path: '/recommend', endpoints: 7 },
      { name: '跨省通办', path: '/cross-province', endpoints: 8 },
    ],
    docs: {
      health: '/api/health',
      gateway: '/api',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/matter', matterRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/cross-province', crossProvinceRoutes);

app.use('/admin', express.static(path.join(__dirname, '../admin')));

app.use((req, res) => {
  return errorResponse(res, '接口不存在', 404);
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err);
  return errorResponse(res, err.message || '服务器内部错误', err.status || 500);
});

const server = app.listen(Number(PORT), HOST, () => {
  console.log('========================================');
  console.log('  江苏省人社一体化移动服务平台 API网关');
  console.log('========================================');
  console.log(`  服务地址: http://${HOST}:${PORT}`);
  console.log(`  基础路径: http://${HOST}:${PORT}/api`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`  管理后台: http://${HOST}:${PORT}/admin`);
  console.log('========================================');
  console.log(`  启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在优雅关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在优雅关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

export default app;
