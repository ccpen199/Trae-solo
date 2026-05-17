const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = parseInt(process.env.PORT) || 48361;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:48362',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const initDB = require('./models/db');
initDB();

const authRoutes = require('./routes/auth');
const babyRoutes = require('./routes/baby');
const bookRoutes = require('./routes/book');
const inviteRoutes = require('./routes/invite');
const postRoutes = require('./routes/post');
const serviceRoutes = require('./routes/service');
const mallRoutes = require('./routes/mall');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/baby', babyRoutes);
app.use('/api/book', bookRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/post', postRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '伴宝成长后端服务运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 伴宝成长后端服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
