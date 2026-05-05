import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma';

import authRoutes from './routes/auth.routes';
import assetRoutes from './routes/asset.routes';
import paymentRoutes from './routes/payment.routes';
import redeemRoutes from './routes/redeem.routes';
import withdrawRoutes from './routes/withdraw.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '21224');

app.use(cors({
  origin: ['http://localhost:11224'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '余额宝理财服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/redeems', redeemRoutes);
app.use('/api/withdraws', withdrawRoutes);
app.use('/api/reports', reportRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');

    app.listen(PORT, () => {
      console.log(`==============================`);
      console.log(`  余额宝理财服务已启动`);
      console.log(`  后端地址: http://localhost:${PORT}`);
      console.log(`  端口: ${PORT}`);
      console.log(`==============================`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('数据库连接已关闭');
  process.exit(0);
});

export default app;
