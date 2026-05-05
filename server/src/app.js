require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const entryRoutes = require('./routes/entryRoutes');
const cateringRoutes = require('./routes/cateringRoutes');
const bookletRoutes = require('./routes/bookletRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    'http://localhost:22212',
    'http://127.0.0.1:22212',
    'http://localhost:12212',
    'http://127.0.0.1:12212'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/catering', cateringRoutes);
app.use('/api/booklets', bookletRoutes);
app.use('/api/reports', reportRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`找不到路径: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

const PORT = process.env.PORT || 12212;

const startServer = async () => {
  try {
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');
    
    await sequelize.sync({ alter: true });
    console.log('✓ 数据库同步完成');
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  会展管理系统 - 后端服务');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  端口号: ${PORT}`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
      console.log('  API 文档:');
      console.log(`  - 健康检查: GET  http://localhost:${PORT}/api/health`);
      console.log(`  - 用户登录: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`  - 条码管理: GET  http://localhost:${PORT}/api/barcodes`);
      console.log(`  - 入场扫描: POST http://localhost:${PORT}/api/entries/scan`);
      console.log(`  - 餐饮消费: POST http://localhost:${PORT}/api/catering/scan`);
      console.log(`  - 图册发放: POST http://localhost:${PORT}/api/booklets/scan`);
      console.log(`  - 统计报表: GET  http://localhost:${PORT}/api/reports/dashboard`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();
