import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  databaseExists,
  dbPath,
  findTraceBatch,
  getCounts,
  getDashboard,
  initializeDatabase,
  listProducts,
  listRows,
  listTraceBatches,
} from './db';

dotenv.config();
initializeDatabase();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59141);

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'may-89141 traceability-api',
    host,
    port,
    database: {
      path: dbPath,
      exists: databaseExists(),
      counts: getCounts(),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(getDashboard());
});

app.get('/api/trace', (req, res) => {
  const code = String(req.query.code || '');
  if (!code) {
    res.json({ batches: listTraceBatches() });
    return;
  }

  const result = findTraceBatch(code);
  if (!result) {
    res.status(404).json({ error: 'TRACE_CODE_NOT_FOUND', message: '未找到该溯源码' });
    return;
  }

  res.json(result);
});

app.get('/api/trace/:code', (req, res) => {
  const result = findTraceBatch(req.params.code);
  if (!result) {
    res.status(404).json({ error: 'TRACE_CODE_NOT_FOUND', message: '未找到该溯源码' });
    return;
  }

  res.json(result);
});

app.get('/api/products', (req, res) => {
  const channel = req.query.channel ? String(req.query.channel) : undefined;
  res.json({ products: listProducts(channel) });
});

app.get('/api/orders', (_req, res) => {
  res.json({ orders: listRows('orders') });
});

app.get('/api/contracts', (_req, res) => {
  res.json({ contracts: listRows('contracts') });
});

app.get('/api/agtech/questions', (_req, res) => {
  res.json({ questions: listRows('questions') });
});

app.get('/api/weather', (_req, res) => {
  res.json({ alerts: listRows('weather_alerts') });
});

app.get('/api/regulatory', (_req, res) => {
  res.json({
    trends: getDashboard().qualityTrend,
    reports: [
      { id: 'rp-2026-06', title: '2026年6月区域质量趋势分析', risk: '低', sampleCount: 1846, passRate: 98.7 },
      { id: 'rp-2026-q2', title: '2026年二季度农残抽检报告', risk: '中低', sampleCount: 5172, passRate: 98.4 },
    ],
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.listen(port, host, () => {
  console.log(`may-89141 backend listening on http://${host}:${port}`);
});
