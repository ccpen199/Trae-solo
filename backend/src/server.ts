import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import { initSchema } from './db/schema';
import { seedDatabase } from './data/seed';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import riderRouter from './routes/rider';
import merchantRouter from './routes/merchant';
import adminRouter from './routes/admin';
import commonRouter from './routes/common';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 58921);
const HOST = process.env.BACKEND_HOST || process.env.HOST || '0.0.0.0';

const allowedOrigins = [
  `http://localhost:${process.env.FRONTEND_PORT || 48921}`,
  `http://127.0.0.1:${process.env.FRONTEND_PORT || 48921}`,
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/rider', riderRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/common', commonRouter);

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      timestamp: new Date().toISOString()
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

const db = initDatabase();
initSchema(db);
seedDatabase(db);

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
