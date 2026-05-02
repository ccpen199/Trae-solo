import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getDatabase } from './database';

import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import workflowRoutes from './routes/workflow';
import messageRoutes from './routes/messages';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 11135;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11136';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:11136'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
);

async function startServer() {
  try {
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const fullDbPath = path.resolve(__dirname, '..', dbPath);
    
    console.log('Initializing database at:', fullDbPath);
    await getDatabase(fullDbPath);
    console.log('Database initialized successfully');

    app.listen(Number(PORT), () => {
      console.log('========================================');
      console.log('  固定资产管理系统 - 后端服务');
      console.log('========================================');
      console.log(`  端口: ${PORT}`);
      console.log(`  数据库: ${fullDbPath}`);
      console.log(`  前端地址: ${FRONTEND_URL}`);
      console.log('========================================');
      console.log(`  服务已启动: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
