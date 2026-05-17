require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const liveRoutes = require('./routes/live');
const mallRoutes = require('./routes/mall');
const messageRoutes = require('./routes/messages');
const gameRoutes = require('./routes/game');
const userRoutes = require('./routes/user');
const adRoutes = require('./routes/ads');

const app = express();
const PORT = process.env.PORT || 47751;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:47752',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ads', adRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'B站战略版后端服务运行正常', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: '欢迎访问B站战略版API', docs: '/api/health' });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           B站战略版后端服务已启动                              ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                              ║
║  健康检查: http://localhost:${PORT}/api/health                  ║
║  数据库: SQLite                                               ║
║  启动时间: ${new Date().toISOString()}                           ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
