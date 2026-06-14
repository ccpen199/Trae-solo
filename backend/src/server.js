require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const wasteRoutes = require('./routes/waste');
const orderRoutes = require('./routes/order');
const transferRoutes = require('./routes/transfer');
const scheduleRoutes = require('./routes/schedule');
const blockchainRoutes = require('./routes/blockchain');
const priceRoutes = require('./routes/price');
const adminRoutes = require('./routes/admin');
const vehicleRoutes = require('./routes/vehicle');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wastes', wasteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '再生资源产业互联网交易平台 API 服务正常运行中', timestamp: new Date().toISOString() });
});

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 59211;

app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
});
