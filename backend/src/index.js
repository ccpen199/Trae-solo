import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import parkingLotsRouter from './routes/parkingLots.js';
import spotStatusRouter from './routes/spotStatus.js';
import guidanceRouter from './routes/guidance.js';
import entryExitRouter from './routes/entryExit.js';
import dashboardRouter from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.join(__dirname, '../..');

dotenv.config({ path: path.join(projectDir, '.env') });

const dataDir = path.join(projectDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

import './database.js';

const app = express();
const PORT = Number(process.env.BACKEND_PORT || 53449);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/parking-lots', parkingLotsRouter);
app.use('/api/spot-status', spotStatusRouter);
app.use('/api/guidance', guidanceRouter);
app.use('/api/entry-exit', entryExitRouter);
app.use('/api/dashboard', dashboardRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
