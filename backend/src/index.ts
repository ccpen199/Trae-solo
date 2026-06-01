import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './data/db.js';
import photographersRouter from './routes/photographers.js';
import bookingsRouter from './routes/bookings.js';
import ordersRouter from './routes/orders.js';
import deliveriesRouter from './routes/deliveries.js';
import reportsRouter from './routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT) || 53472;

app.use(cors({ origin: `http://${HOST}:${process.env.FRONTEND_PORT || 43472}` }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'healthy', sqlite: 'ok' } });
});

app.use('/api/photographers', photographersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/reports', reportsRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
