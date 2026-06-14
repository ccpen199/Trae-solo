import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import jobseekerRoutes from './routes/jobseekers';
import companyRoutes from './routes/companies';
import matchRoutes from './routes/matches';
import interviewRoutes from './routes/interviews';
import offerRoutes from './routes/offers';
import masterDataRoutes from './routes/masterData';
import adminRoutes from './routes/admin';
import schoolRoutes from './routes/schools';
import supervisionRoutes from './routes/supervision';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 59094;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: ['http://127.0.0.1:49094', 'http://localhost:49094'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'talent-platform-backend',
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/supervision', supervisionRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📡 Health check: http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
