import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import babyRoutes from './routes/baby.routes';
import mediaRoutes from './routes/media.routes';
import momentRoutes from './routes/moment.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 48302;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:48301',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/babies', babyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '宝宝时光机后端服务运行正常', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  logger.info(`🚀 宝宝时光机后端服务启动成功`);
  logger.info(`📍 服务地址: http://localhost:${PORT}`);
  logger.info(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});
