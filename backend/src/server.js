require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const scheduleRoutes = require('./routes/schedules');
const containerRoutes = require('./routes/containers');
const billRoutes = require('./routes/bills');
const messageRoutes = require('./routes/messages');
const auditRoutes = require('./routes/audit');
const exceptionRoutes = require('./routes/exceptions');

const app = express();
const PORT = process.env.PORT || 11761;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11762';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-User-Id', 'X-User-Role', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/exceptions', exceptionRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端点不存在',
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           船运订舱系统 - 后端服务已启动                      ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                         ║
║  健康检查: http://localhost:${PORT}/api/health              ║
║  前端地址: ${FRONTEND_URL}                                 ║
╠════════════════════════════════════════════════════════════╣
║  默认用户:                                                  ║
║  - 货主: consignor1 / 123456                               ║
║  - 货代: forwarder1 / 123456                               ║
║  - 船公司: shipping1 / 123456                               ║
║  - 港口: port1 / 123456                                     ║
║  - 报关行: customs1 / 123456                               ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
