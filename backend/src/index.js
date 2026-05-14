require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database/db');

const app = express();
const PORT = process.env.PORT || 9810;

app.use(cors({
  origin: ['http://localhost:9811', 'http://127.0.0.1:9811'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const messageRoutes = require('./routes/message');

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Didi Express API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/message', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  🚀 Didi Express Backend Server`);
  console.log(`========================================`);
  console.log(`  📍 Running on: http://localhost:${PORT}`);
  console.log(`  🔧 API Base: http://localhost:${PORT}/api`);
  console.log(`  💾 Database: ${path.resolve(process.env.DB_PATH || './data/app.sqlite')}`);
  console.log(`========================================\n`);
});