import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/init';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import goalRoutes from './routes/goals';
import workoutRoutes from './routes/workouts';
import alertRoutes from './routes/alerts';
import coachRoutes from './routes/coach';
import adminRoutes from './routes/admin';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '52661');
const HOST = '127.0.0.1';

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '42661');

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', goalRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

initDatabase();

const server = app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🚀 健康运动数据平台后端已启动`);
  console.log(`📍 服务地址: http://${HOST}:${PORT}`);
  console.log(`🔌 健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`📅 启动时间: ${new Date().toLocaleString()}`);
  console.log(`========================================\n`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;
