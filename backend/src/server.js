import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import activityRoutes from './routes/activities.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 58934;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48934}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
