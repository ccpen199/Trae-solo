import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = parseInt(process.env.PORT || '9169', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9170';

const dataDir = path.join(__dirname, '../../data');
const storageDir = path.join(__dirname, '../../storage');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

import { initDatabase, initSeedData } from './database/schema.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import versionRoutes from './routes/versions.js';
import shareRoutes from './routes/shares.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:9170'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: '接口不存在' });
});

async function startServer() {
  try {
    console.log('初始化数据库...');
    initDatabase();
    
    console.log('初始化种子数据...');
    initSeedData();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('   文件存储与网盘系统 - 后端服务');
      console.log('========================================');
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API 前缀: /api`);
      console.log(`前端地址: ${FRONTEND_URL}`);
      console.log('========================================');
      console.log('默认账号:');
      console.log('  管理员: admin / admin123');
      console.log('  普通用户: user1 / user123');
      console.log('========================================');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
