import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import pickupRoutes from './routes/pickup.js';
import scanRoutes from './routes/scan.js';
import waybillRoutes from './routes/waybill.js';
import trackingRoutes from './routes/tracking.js';
import contrabandRoutes from './routes/contraband.js';
import freightRoutes from './routes/freight.js';
import complaintRoutes from './routes/complaint.js';
import invoiceRoutes from './routes/invoice.js';
import membershipRoutes from './routes/membership.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadProjectEnv();

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59160);

app.use(cors({ origin: true }));
app.use(express.json());
app.set('db', db);

app.get('/api/health', (_req, res) => {
  const sqliteCheck = db.prepare('SELECT 1 AS ok').get() as { ok: number } | undefined;
  res.json({
    ok: true,
    service: 'may-89160-backend',
    app: '快递物流全链路控制台',
    sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/pickup', pickupRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/waybill', waybillRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/contraband', contrabandRoutes);
app.use('/api/freight', freightRoutes);
app.use('/api/complaint', complaintRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/dashboard', dashboardRoutes);

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
