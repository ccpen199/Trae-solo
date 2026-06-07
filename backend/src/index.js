import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import riderRoutes from './routes/riders.js';
import orderRoutes from './routes/orders.js';
import settlementRoutes from './routes/settlements.js';
import dispatchRoutes from './routes/dispatch.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 59013;

app.use(cors({
  origin: 'http://127.0.0.1:49013',
  credentials: true,
}));
app.use(express.json());

initDb();

app.use('/api/auth', authRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`闪送员众包配送平台后端服务运行在 http://127.0.0.1:${PORT}`);
});
