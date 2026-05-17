require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const searchRoutes = require('./routes/search');
const commentRoutes = require('./routes/comments');
const contentRoutes = require('./routes/content');
const playlistRoutes = require('./routes/playlists');

const app = express();
const PORT = process.env.PORT || 47931;

app.use(cors({
  origin: ['http://localhost:47932', 'http://127.0.0.1:47932'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/playlists', playlistRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           音乐推荐后端服务已启动                               ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                           ║
║  健康检查: http://localhost:${PORT}/api/health                ║
║  API文档: 请参考代码中的路由定义                               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});