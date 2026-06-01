import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import db from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import storesRouter from './routes/stores.js';
import employeesRouter from './routes/employees.js';
import leavesRouter from './routes/leaves.js';
import schedulesRouter from './routes/schedules.js';
import materialsRouter from './routes/materials.js';
import lossRouter from './routes/loss.js';
import prepRouter from './routes/prep.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 50000;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 40000}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/stores', storesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/loss', lossRouter);
app.use('/api/prep', prepRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
