require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/database');

const monitorRoutes = require('./routes/monitor');
const violationRoutes = require('./routes/violation');
const enterpriseRoutes = require('./routes/enterprise');
const reportRoutes = require('./routes/report');
const notificationRoutes = require('./routes/notification');
const userRoutes = require('./routes/user');

const app = express();
const PORT = parseInt(process.env.PORT) || 110991;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:110992',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return oldJson.call(this, body);
  };
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'env-monitor-backend',
      status: 'running',
      timestamp: new Date().toISOString(),
      port: PORT,
    },
  });
});

app.use(`${API_PREFIX}/monitor`, monitorRoutes);
app.use(`${API_PREFIX}/violations`, violationRoutes);
app.use(`${API_PREFIX}/enterprises`, enterpriseRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const dbExists = fs.existsSync(dbPath);
    if (!dbExists) {
      await sequelize.sync({ force: true });
      console.log('数据库创建完成');
      
      const initDataPath = path.join(__dirname, './initData.js');
      if (fs.existsSync(initDataPath)) {
        try {
          const initData = require('./initData');
          await initData();
          console.log('初始化数据完成');
        } catch (initError) {
          console.warn('初始化数据执行失败，但不影响启动:', initError.message);
        }
      }
    } else {
      await sequelize.sync();
      console.log('数据库同步完成');
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  环保监测平台 - 后端服务');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 前缀: ${API_PREFIX}`);
      console.log(`  数据库: SQLite (${path.join(dataDir, 'app.sqlite')})`);
      console.log(`  启动时间: ${new Date().toISOString()}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
