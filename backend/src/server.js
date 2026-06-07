const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'),
  override: true
});
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const seatRoutes = require('./routes/seats');
const pricingRoutes = require('./routes/pricing');
const orderRoutes = require('./routes/orders');
const eticketRoutes = require('./routes/etickets');
const discoverRoutes = require('./routes/discover');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 58941;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48941}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/etickets', eticketRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`票务中台后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
