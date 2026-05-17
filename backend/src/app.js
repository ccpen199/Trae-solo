require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const commentRoutes = require('./routes/comment');
const messageRoutes = require('./routes/message');

const app = express();
const PORT = process.env.BACKEND_PORT || 47702;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/message', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
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

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 后端服务已启动`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
