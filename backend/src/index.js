require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const initDB = require('./models/init');

const app = express();
const PORT = process.env.PORT || 48212;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '藏书馆后端服务运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
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

const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`
=============================================
  藏书馆后端服务已启动
  端口: ${PORT}
  环境: ${process.env.NODE_ENV || 'development'}
  健康检查: http://localhost:${PORT}/api/health
=============================================
      `);
    });
  } catch (err) {
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
