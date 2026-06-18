import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { initDatabase } from './models/database';
import { seedInitialData } from './utils/seed';

import authRoutes from './routes/auth';
import workerRoutes from './routes/workers';
import employerRoutes from './routes/employers';
import orderRoutes from './routes/orders';
import trainingRoutes from './routes/training';
import communityRoutes from './routes/community';
import insuranceRoutes from './routes/insurance';
import adminRoutes from './routes/admin';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59231', 10);
const HOST = '127.0.0.1';

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 49231}`,
    `http://localhost:${process.env.FRONTEND_PORT || 49231}`,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initDatabase();
seedInitialData();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '家政从业者赋能工作台 API',
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/support', insuranceRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message || 'Unknown error',
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`  家政从业者赋能工作台 - 后端服务已启动`);
  console.log(`  监听地址: http://${HOST}:${PORT}`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`  API前缀:   http://${HOST}:${PORT}/api`);
  console.log(`  环境:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================\n`);
});

export default app;
