require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const transactionRoutes = require('./routes/transactions');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const certificateRoutes = require('./routes/certificates');

const app = express();
const PORT = process.env.BACKEND_PORT || 58830;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48830}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/public/stats', (req, res) => {
  const { db } = require('./database');
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const listings = db.prepare('SELECT COUNT(*) as count FROM listings WHERE status = 1').get().count;
  const verified = db.prepare('SELECT COUNT(*) as count FROM listings WHERE is_verified = 1 AND status = 1').get().count;
  const transactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  res.json({ users, listings, verified, transactions });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

initDatabase();

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务启动成功: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
