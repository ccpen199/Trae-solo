require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const initDatabase = require('./database/init');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const readerRoutes = require('./routes/readers');
const adminRoutes = require('./routes/admins');
const borrowRoutes = require('./routes/borrow');

const app = express();
const PORT = process.env.PORT || 12237;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22371',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/readers', readerRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/borrow', borrowRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '图书管理系统服务运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  图书管理系统后端服务已启动`);
      console.log(`========================================`);
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API前缀: /api`);
      console.log(`  数据库: SQLite (./data/library.db)`);
      console.log(`========================================`);
      console.log(`  默认账号:`);
      console.log(`  - 管理员: admin / admin123`);
      console.log(`  - 读者: reader / reader123`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
