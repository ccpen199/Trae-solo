import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import customersRouter from './routes/customers.js';
import documentsRouter from './routes/documents.js';
import creditRouter from './routes/credit.js';
import approvalsRouter from './routes/approvals.js';
import commonRouter from './routes/common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 56800;

app.use(cors({ origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 46800}`, `http://localhost:${process.env.FRONTEND_PORT || 46800}`] }));
app.use(express.json());

initDatabase();

app.use('/api/customers', customersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/credit', creditRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api', commonRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 房贷资料流转系统后端服务已启动`);
  console.log(`📍 监听地址: http://127.0.0.1:${PORT}`);
  console.log(`📊 健康检查: http://127.0.0.1:${PORT}/api/health`);
});
