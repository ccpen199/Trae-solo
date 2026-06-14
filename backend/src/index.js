require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('./models/init-db');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const pricingRoutes = require('./routes/pricing');
const insuranceRoutes = require('./routes/insurance');
const reviewRoutes = require('./routes/reviews');
const exceptionRoutes = require('./routes/exceptions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 58822;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48822}`,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务已启动，监听端口: ${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
