import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { initDB } from './db/init';
import authRoutes from './routes/auth';
import newsRoutes from './routes/news';
import videoRoutes from './routes/video';
import creatorRoutes from './routes/creator';
import taskRoutes from './routes/task';
import adminRoutes from './routes/admin';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '58989', 10);
const FRONTEND_PORT = process.env.FRONTEND_PORT || '48989';

app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    'http://localhost:48989',
    'http://127.0.0.1:48989',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDB();

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
