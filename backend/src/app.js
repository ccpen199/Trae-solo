require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const registrationRoutes = require('./routes/registrations');
const bidRoutes = require('./routes/bids');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:110932',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '政府采购管理业务系统 - 后端服务运行正常',
    port: process.env.PORT || 110931,
    timestamp: new Date().toISOString(),
    engines: {
      'Escrow-Control': '运行中 - 保证金托管引擎',
      'Auction-Bid': '运行中 - 竞价引擎',
      'Bid-Security': '运行中 - 加密引擎',
      'Integrity-Verify': '运行中 - 审计引擎'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/audit', auditRoutes);

app.use((err, req, res, next) => {
  console.error('全局错误处理:', err);
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '数据已存在',
      errors: err.errors.map(e => e.message)
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

module.exports = app;
