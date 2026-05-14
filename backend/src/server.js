require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 9801;

app.use(cors({
  origin: ['http://localhost:9802', 'http://127.0.0.1:9802'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    name: '壹互 API',
    version: '1.0.0',
    description: '校园配送加社区软件后端服务',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      posts: '/api/posts',
      messages: '/api/messages'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  壹互后端服务已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  API地址: http://localhost:${PORT}/api`);
  console.log(`  数据库: ${path.join(__dirname, '../', process.env.DB_PATH || 'data/app.sqlite')}`);
  console.log(`========================================\n`);
});

module.exports = app;
