require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const { initDatabase, seedMockData } = require('./scripts/initDb');

const authRoutes = require('./routes/auth');
const consultationRoutes = require('./routes/consultations');
const messageRoutes = require('./routes/messages');
const lawyerRoutes = require('./routes/lawyers');
const caseRoutes = require('./routes/cases');
const disputeRoutes = require('./routes/disputes');
const walletRoutes = require('./routes/wallet');

const app = express();
const PORT = process.env.PORT || 110911;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:110912';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '法律咨询平台后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      minConsultationAmount: process.env.MIN_CONSULTATION_AMOUNT || 50,
      maxConsultationAmount: process.env.MAX_CONSULTATION_AMOUNT || 10000,
      platformFeeRate: process.env.PLATFORM_FEE_RATE || 0.20,
      lawyerCommissionRate: process.env.LAWYER_COMMISSION_RATE || 0.80
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/wallet', walletRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

const startServer = () => {
  try {
    console.log('正在初始化数据库...');
    initDatabase();
    console.log('数据库初始化完成');

    console.log('正在填充测试数据...');
    seedMockData();
    console.log('测试数据填充完成');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║           在线法律咨询平台 - 后端服务                        ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                            ║
║  健康检查: http://localhost:${PORT}/api/health                  ║
║  API文档: http://localhost:${PORT}/api/config                  ║
╠════════════════════════════════════════════════════════════╣
║  测试账号:                                                    ║
║  - 普通用户: client1 / 123456                               ║
║  - 律师: lawyer1 / 123456                                    ║
║  - 客服: cs1 / 123456                                        ║
║  - 财务: finance1 / 123456                                   ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
