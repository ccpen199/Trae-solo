import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase, seedDatabase } from './database';

import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import materialRoutes from './routes/materials';
import lecturerRoutes from './routes/lecturers';
import publicationRoutes from './routes/publication';
import piracyRoutes from './routes/piracy';
import enforcementRoutes from './routes/enforcement';
import reportRoutes from './routes/reports';
import auditRoutes from './routes/audit';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3001');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '版权保护系统 API 服务正常运行' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/piracy', piracyRoutes);
app.use('/api/enforcement', enforcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'API 端点不存在' });
});

app.use((err: any, req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startServer() {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`端口 ${PORT} 已被占用，请释放端口或修改 .env 中的 BACKEND_PORT`);
    process.exit(1);
  }

  console.log('正在初始化数据库...');
  initDatabase();

  const dbPath = path.join(__dirname, '../../data/copyright.db');
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
    console.log('正在初始化数据...');
    seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`版权保护系统 API 服务已启动`);
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`API 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`========================================\n`);
  });
}

startServer().catch((error) => {
  console.error('启动服务器失败:', error);
  process.exit(1);
});
