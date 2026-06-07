import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './config/database';
import logger from './config/logger';
import initDatabase from './database/init';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import itemRoutes from './routes/items';
import applicationRoutes from './routes/applications';
import certificateRoutes from './routes/certificates';
import sealRoutes from './routes/seals';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.BACKEND_PORT || 59007;

app.use(cors({
  origin: ['http://127.0.0.1:49007', 'http://localhost:49007'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    code: 200, 
    message: 'ok',
    data: {
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/seals', sealRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('服务器错误', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

const startServer = async () => {
  try {
    initDatabase();
    logger.info('数据库初始化完成');

    app.listen(Number(PORT), '127.0.0.1', () => {
      logger.info(`后端服务启动成功，监听地址: http://127.0.0.1:${PORT}`);
      console.log(`后端服务启动成功，监听地址: http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    logger.error('服务启动失败', error);
    process.exit(1);
  }
};

startServer();
