import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import cargoRoutes from './routes/cargo.js';
import vehicleRoutes from './routes/vehicle.js';
import routeRoutes from './routes/route.js';
import matchingRoutes from './routes/matching.js';
import trackingRoutes from './routes/tracking.js';
import contractRoutes from './routes/contract.js';
import creditRoutes from './routes/credit.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

initDatabase();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '58936');

app.use(cors({ origin: 'http://127.0.0.1:48936' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
