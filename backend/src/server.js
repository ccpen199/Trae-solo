import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

import suppliersRouter from './routes/suppliers.js';
import questionnairesRouter from './routes/questionnaires.js';
import assessmentsRouter from './routes/assessments.js';
import evidencesRouter from './routes/evidences.js';
import rectificationsRouter from './routes/rectifications.js';
import reportsRouter from './routes/reports.js';
import './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 56896;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46896}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/suppliers', suppliersRouter);
app.use('/api/questionnaires', questionnairesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/evidences', evidencesRouter);
app.use('/api/rectifications', rectificationsRouter);
app.use('/api/reports', reportsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`ESG 评估系统后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

export default app;
