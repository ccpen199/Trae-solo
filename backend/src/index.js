require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const stationsRouter = require('./routes/stations');
const chargingRouter = require('./routes/charging');
const paymentsRouter = require('./routes/payments');
const reviewsRouter = require('./routes/reviews');
const maintenanceRouter = require('./routes/maintenance');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = parseInt(process.env.PORT) || 110981;

app.use(cors({
  origin: ['http://localhost:21098', 'http://127.0.0.1:21098'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Charging Platform API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '充电桩运营平台',
      version: '1.0.0',
      description: '新能源基础设施业务系统',
      coreEngines: [
        'OCPP-Connector 协议引擎',
        'Real-time-Billing 计费引擎',
        'Partition-Settlement 分账引擎',
        'Traffic-Balance 调度引擎'
      ],
      roles: [
        '车主 (owner)',
        '桩站运营商 (operator)',
        '场地方 (venue)',
        '运维工程师 (maintainer)',
        '系统管理员 (admin)'
      ]
    }
  });
});

app.use('/api/stations', stationsRouter);
app.use('/api/charging', chargingRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/audit', auditRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully.');
    
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  充电桩运营平台后端服务已启动');
      console.log('========================================');
      console.log('');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/health`);
      console.log(`  API信息: http://localhost:${PORT}/api/info`);
      console.log('');
      console.log('  核心服务:');
      console.log('  - OCPP-Connector 协议引擎');
      console.log('  - Real-time-Billing 计费引擎');
      console.log('  - Partition-Settlement 分账引擎');
      console.log('  - Traffic-Balance 调度引擎');
      console.log('');
      console.log('  数据库: SQLite (data/app.sqlite)');
      console.log('');
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
