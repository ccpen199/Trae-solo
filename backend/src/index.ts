import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPaths = [
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import { initDatabase } from './database';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import jobseekerRoutes from './routes/jobseeker';
import hrRoutes from './routes/hr';
import adminRoutes from './routes/admin';
import commonRoutes from './routes/common';

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 59019;
const HOST = '127.0.0.1';

const frontendPort = Number(process.env.FRONTEND_PORT) || 49019;

app.use(cors({
  origin: `http://127.0.0.1:${frontendPort}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

const logDir = path.join(__dirname, '..');
const accessLogStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });

app.use((req, res, next) => {
  const now = new Date().toISOString();
  accessLogStream.write(`[${now}] ${req.method} ${req.path}\n`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commonRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  accessLogStream.write(`[${new Date().toISOString()}] ERROR: ${err.message}\n`);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`API endpoint: http://${HOST}:${PORT}/api`);
  console.log(`Frontend port: ${frontendPort}`);
  console.log(`CORS origin: http://127.0.0.1:${frontendPort}`);
});
