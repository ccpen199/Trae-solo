import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './config/database.js';

import authRoutes from './routes/auth.js';
import riskRoutes from './routes/risk.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import assetRoutes from './routes/assets.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 11086;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:21086';

app.use(cors({
  origin: [FRONTEND_URL],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  基金销售平台后端服务`);
  console.log(`========================================`);
  console.log(`  端口: ${PORT}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
  console.log(`  API 端点:`);
  console.log(`  - GET  /health`);
  console.log(`  - POST /api/auth/register`);
  console.log(`  - POST /api/auth/login`);
  console.log(`  - GET  /api/auth/me`);
  console.log(`  - GET  /api/products`);
  console.log(`  - GET  /api/risk/questions`);
  console.log(`  - POST /api/risk/submit`);
  console.log(`  - GET  /api/orders`);
  console.log(`  - POST /api/orders/purchase`);
  console.log(`  - POST /api/orders/redemption`);
  console.log(`  - GET  /api/assets`);
  console.log(`  - GET  /api/admin/users, /api/admin/orders, /api/admin/events`);
  console.log(`========================================`);
});

export default app;
