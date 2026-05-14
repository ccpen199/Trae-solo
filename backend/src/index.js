require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9951;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:9952',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/share', require('./routes/share'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/activities', require('./routes/activities'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Coupon Platform API is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Coupon Platform Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
