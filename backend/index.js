require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const accountRoutes = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 48391;

app.use(cors({
  origin: ['http://localhost:48392', 'http://127.0.0.1:48392'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/account', accountRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Service is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 积木盒子后端服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/api/health`);
});
