const dotenv = require('dotenv');
dotenv.config({ override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initTables, initMockData } = require('./db');

const app = express();
const PORT = 48322;

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: ['http://localhost:48321', 'http://127.0.0.1:48321'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function initDB() {
  try {
    await initTables();
    await initMockData();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}
initDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '猫狗日记API服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`猫狗日记后端服务已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});
