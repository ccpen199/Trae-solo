import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDB } from './db';
import authRoutes from './routes/auth';
import laborRoutes from './routes/labor';
import deliveryRoutes from './routes/delivery';
import movingRoutes from './routes/moving';
import gpsRoutes from './routes/gps';
import reviewRoutes from './routes/reviews';
import notificationRoutes from './routes/notifications';
import disputeRoutes from './routes/disputes';
import insuranceRoutes from './routes/insurance';
import adminRoutes from './routes/admin';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 59218;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49218',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbPath = path.resolve(__dirname, '../data/app.sqlite');
initDB(dbPath);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'city-work-logistics-platform',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/labor-orders', laborRoutes);
app.use('/api/delivery-orders', deliveryRoutes);
app.use('/api/moving-orders', movingRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/insurance-claims', insuranceRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`🚀 后端服务已启动`);
  console.log(`   端口: ${PORT}`);
  console.log(`   地址: http://127.0.0.1:${PORT}`);
  console.log(`   健康检查: http://127.0.0.1:${PORT}/api/health`);
});

export default app;
