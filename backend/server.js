require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const { authMiddleware } = require('./middleware/auth');

const indexRoutes = require('./routes/index');
const articleRoutes = require('./routes/articles');
const albumRoutes = require('./routes/albums');
const mediaRoutes = require('./routes/media');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = parseInt(process.env.PORT) || 12180;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:22180';

app.use(cors({
  origin: [CORS_ORIGIN, 'http://127.0.0.1:22180'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(__dirname, process.env.UPLOAD_PATH || 'uploads');
app.use('/uploads', express.static(uploadPath));

app.use('/api', indexRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware('admin'), adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  个人网站后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();
