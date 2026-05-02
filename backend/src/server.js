require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const directoryRoutes = require('./routes/directories');
const tagRoutes = require('./routes/tags');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const todoRoutes = require('./routes/todos');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 11143;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:21143';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/directories', directoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const startServer = async () => {
  try {
    initDatabase();
    console.log('数据库初始化完成');

    app.listen(PORT, () => {
      console.log(`企业知识库系统后端服务启动成功`);
      console.log(`访问地址: http://localhost:${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
