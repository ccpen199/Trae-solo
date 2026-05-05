import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma/client.js';

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import salaryRoutes from './routes/salaryRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import rewardPunishmentRoutes from './routes/rewardPunishmentRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 12232;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:21232',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hrms-backend',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/reward-punishments', rewardPunishmentRoutes);
app.use('/api/users', userRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 HRMS Backend Server running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}`);
      console.log(`🔧 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:21232'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
