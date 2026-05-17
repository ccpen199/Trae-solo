const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { initDatabase } = require('./models/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.BACKEND_PORT || 14776;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', (req, res, next) => {
  try {
    next();
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: '服务器运行正常' });
});

app.use((err, req, res, next) => {
  console.error('全局错误捕获:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

const startServer = async () => {
  try {
    await initDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`后端服务器运行在 http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      console.error('服务器错误:', error);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
