import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const app = express();
const PORT = 54817;
const FRONTEND_PORT = 44817;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logDir = join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logStream = fs.createWriteStream(join(logDir, 'api.log'), { flags: 'a' });

app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}`;
  logStream.write(log + '\n');
  console.log(log);
  next();
});

import userRoutes from './routes/user.js';
import companyRoutes from './routes/company.js';
import orderRoutes from './routes/order.js';
import trackingRoutes from './routes/tracking.js';
import priceRoutes from './routes/price.js';
import pickupRoutes from './routes/pickup.js';
import urgentRoutes from './routes/urgent.js';
import intlRoutes from './routes/intl.js';
import exceptionRoutes from './routes/exception.js';
import addressRoutes from './routes/address.js';

app.use('/api/user', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/urgent', urgentRoutes);
app.use('/api/intl', intlRoutes);
app.use('/api/exception', exceptionRoutes);
app.use('/api/address', addressRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
