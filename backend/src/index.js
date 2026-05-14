require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initTables, seedData } = require('./database');

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/user');
const rentalRoutes = require('./routes/rental');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 12570;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:12571';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    message: '服务正常'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', homeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/rental', rentalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Global error:', err);
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

initTables();
seedData();

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  家电租借平台后端服务已启动');
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log('  测试账号: 13800138000 / 123456 (已实名)');
  console.log('  测试账号: 13800138001 / 123456 (未实名)');
  console.log('  管理账号: admin / 123456');
  console.log('========================================');
});
