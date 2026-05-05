require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database/init');

const userRoutes = require('./routes/user');
const homeRoutes = require('./routes/home');
const searchRoutes = require('./routes/search');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/address');
const orderRoutes = require('./routes/order');

const app = express();
const PORT = process.env.PORT || 23141;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:33141',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/order', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务运行正常', data: { timestamp: new Date().toISOString() } });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  前置仓生鲜到家平台后端服务`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  API 前缀: /api`);
  console.log(`========================================`);
});

module.exports = app;
