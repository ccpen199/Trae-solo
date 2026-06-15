import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { initDatabase } from './database';
import { seedData } from './seed';
import { errorHandler } from './middleware';

import authRoutes from './routes/auth';
import demandRoutes from './routes/demand';
import contractRoutes from './routes/contract';
import supervisionRoutes from './routes/supervision';
import showroomRoutes from './routes/showroom';
import gisRoutes from './routes/gis';
import workorderRoutes from './routes/workorder';
import adminRoutes from './routes/admin';

const app = express();
const PORT = parseInt(process.env.PORT || '59241');
const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49241';

app.use(cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:49241', 'http://127.0.0.1:49242'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/supervision', supervisionRoutes);
app.use('/api/showroom', showroomRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/workorders', workorderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'home-decoration-saas',
    version: '1.0.0',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    name: '家装产业协同SaaS平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      demands: '/api/demands/*',
      contracts: '/api/contracts/*',
      supervision: '/api/supervision/*',
      showroom: '/api/showroom/*',
      gis: '/api/gis/*',
      workorders: '/api/workorders/*',
      admin: '/api/admin/*',
      health: '/api/health',
    },
  });
});

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

async function startServer() {
  try {
    initDatabase();
    seedData();

    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 家装产业协同SaaS平台后端启动成功`);
      console.log(`📍 监听地址: http://${HOST}:${PORT}`);
      console.log(`🔗 API 地址: http://${HOST}:${PORT}/api`);
      console.log(`💚 健康检查: http://${HOST}:${PORT}/api/health`);
      console.log(`🌐 前端地址: ${FRONTEND_URL}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
