require('dotenv').config({ path: '../../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRoute = require('./routes/users');
const productsRoute = require('./routes/products');
const cartRoute = require('./routes/cart');
const ordersRoute = require('./routes/orders');
const videosRoute = require('./routes/videos');
const addressesRoute = require('./routes/addresses');

const app = express();
const PORT = process.env.BACKEND_PORT || 23164;

app.use(cors({
  origin: ['http://localhost:33164', 'http://127.0.0.1:33164'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '一品鲜生鲜电商平台API运行正常', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRoute);
app.use('/api/products', productsRoute);
app.use('/api/cart', cartRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/videos', videosRoute);
app.use('/api/addresses', addressesRoute);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  一品鲜生鲜电商平台后端服务已启动');
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log('========================================');
});

module.exports = app;
