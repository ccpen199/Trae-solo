import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db/init.ts';
import { migrateDatabase } from './db/migrate.ts';
import authRoutes from './routes/auth.ts';
import waybillRoutes from './routes/waybills.ts';
import knightRoutes from './routes/knights.ts';
import dispatchRoutes from './routes/dispatch.ts';
import trackingRoutes from './routes/tracking.ts';
import exceptionRoutes from './routes/exceptions.ts';
import insuranceRoutes from './routes/insurance.ts';
import dashboardRoutes from './routes/dashboard.ts';
import heatmapRoutes from './routes/heatmap.ts';
import { checkExceptions } from './services/circuitBreaker.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const PORT = process.env.BACKEND_PORT || 59055;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49055;

const app = express();

app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`,
  ],
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

initDatabase();
migrateDatabase();

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/waybills', waybillRoutes);
app.use('/api/knights', knightRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/heatmap', heatmapRoutes);

setInterval(() => {
  try {
    const result = checkExceptions();
    if (result.total > 0) {
      console.log(`[${new Date().toISOString()}] Exception check found ${result.total} issues: pickup_timeout=${result.pickup_timeout}, delivery_timeout=${result.delivery_timeout}, knight_offline=${result.knight_offline}`);
    }
  } catch (err) {
    console.error('Exception check error:', err);
  }
}, 30 * 1000);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Delivery dispatch backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
