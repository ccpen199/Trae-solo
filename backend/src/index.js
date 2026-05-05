require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const approvalRoutes = require('./routes/approval');
const queryRoutes = require('./routes/query');
const { createTables } = require('./database/init');
const { initMemoryDB } = require('./config/memory-db');

const app = express();
const PORT = process.env.PORT || 12214;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22214';
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true';

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const corsOptions = {
  origin: [FRONTEND_URL, 'http://localhost:22214'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/query', queryRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const startServer = async () => {
  try {
    console.log('============================================');
    console.log('公文管理系统后端服务启动中...');
    console.log('============================================');

    if (USE_MEMORY_DB) {
      console.log('使用内存数据库模式（降级模式）');
      await initMemoryDB();
    } else {
      console.log('尝试连接PostgreSQL数据库...');
      try {
        await createTables();
        console.log('PostgreSQL数据库连接成功');
      } catch (dbErr) {
        console.warn('PostgreSQL连接失败，切换到内存数据库模式:', dbErr.message);
        await initMemoryDB();
      }
    }

    app.listen(PORT, () => {
      console.log(`============================================`);
      console.log(`公文管理系统后端服务已启动`);
      console.log(`============================================`);
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API地址: http://localhost:${PORT}/api`);
      console.log(`前端允许地址: ${FRONTEND_URL}`);
      console.log(`数据库模式: ${USE_MEMORY_DB ? '内存数据库' : 'PostgreSQL'}`);
      console.log(`============================================`);
      console.log(`默认用户账号:`);
      console.log(`  admin / admin123 (管理员)`);
      console.log(`  user1 / user123 (普通用户-张三)`);
      console.log(`  user2 / user123 (普通用户-李四)`);
      console.log(`  approver / approver123 (审批人-王总)`);
      console.log(`============================================`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
