import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import usersRouter from './routes/users.js';
import relationsRouter from './routes/relations.js';
import recommendationsRouter from './routes/recommendations.js';
import reportsRouter from './routes/reports.js';
import riskRouter from './routes/risk.js';
import statsRouter from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.BACKEND_PORT || 53408;

const FRONTEND_PORT = process.env.FRONTEND_PORT || 43408;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/relations', relationsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/risk', riskRouter);
app.use('/api/stats', statsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
