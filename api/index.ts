import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/init.js';

import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import attendanceRouter from './routes/attendance.js';
import fundingRouter from './routes/funding.js';
import alertsRouter from './routes/alerts.js';
import statisticsRouter from './routes/statistics.js';
import geofenceRouter from './routes/geofence.js';
import logsRouter from './routes/logs.js';

dotenv.config({ override: true });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59097');
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49097';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/geofence', geofenceRouter);
app.use('/api/logs', logsRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    code: -1,
    message: err.message || '服务器内部错误',
    data: null,
    timestamp: Date.now(),
  });
});

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, HOST, () => {
      console.log(`
===========================================
  河南省中职学生资助监管服务平台
  后端服务启动成功
  地址: http://${HOST}:${PORT}
  健康检查: http://${HOST}:${PORT}/api/health
===========================================
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
