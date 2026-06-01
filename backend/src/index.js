import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { initDB } from './db.js';
import './seed.js';
import dashboardRouter from './routes/dashboard.js';
import ordersRouter from './routes/orders.js';
import batteriesRouter from './routes/batteries.js';
import safetyRouter from './routes/safety.js';
import reportsRouter from './routes/reports.js';
import reservationsRouter from './routes/reservations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '..', '.env');
let BACKEND_PORT = 53431;
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/BACKEND_PORT=(\d+)/);
  if (match) BACKEND_PORT = parseInt(match[1], 10);
} catch (e) {}

const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());

app.use('/api/dashboard', dashboardRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/batteries', batteriesRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/reservations', reservationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${BACKEND_PORT}`);
});
