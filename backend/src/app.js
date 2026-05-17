const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const squareRoutes = require('./routes/square');
const vipRoutes = require('./routes/vip');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 48180;

app.use(cors({
  origin: ['http://localhost:48181', 'http://127.0.0.1:48181'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '藏书馆API运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`
  ========================================
  📚 藏书馆后端服务已启动
  🌐 服务器地址: http://localhost:${PORT}
  📡 API健康检查: http://localhost:${PORT}/api/health
  ========================================
  `);
});
