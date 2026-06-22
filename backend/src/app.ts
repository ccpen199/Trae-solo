import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import diaryRoutes from './routes/diaryRoutes';
import designerRoutes from './routes/designerRoutes';
import aiRoutes from './routes/aiRoutes';
import transactionRoutes from './routes/transactionRoutes';
import moderationRoutes from './routes/moderationRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { notFound } from './middleware/errorMiddleware';

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '装修家居UGC社区与设计师撮合平台 API'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/designers', designerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/moderation', moderationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
