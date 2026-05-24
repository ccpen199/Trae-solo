const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import storeRoutes from './routes/stores';
import orderRoutes from './routes/orders';
import depositRoutes from './routes/deposits';
import inspectionRoutes from './routes/inspections';
import violationRoutes from './routes/violations';
import settlementRoutes from './routes/settlements';
import licenseRoutes from './routes/license';
import statsRoutes from './routes/stats';
import userRoutes from './routes/users';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 52666;
const HOST = '127.0.0.1';

app.use(helmet());
app.use(cors({
  origin: ['http://127.0.0.1:42666', 'http://localhost:42666', 'http://127.0.0.1:43666', 'http://localhost:43666', 'http://127.0.0.1:44666', 'http://localhost:44666', 'http://127.0.0.1:45666', 'http://localhost:45666'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'Car Rental API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'API endpoint not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ code: 500, message: err.message || 'Internal server error' });
});

const server = app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Car Rental Backend Server started`);
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log(`🔗 Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
