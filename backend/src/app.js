require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { success, error } = require('./utils/response');
const db = require('./database');

const billsRouter = require('./routes/bills');
const resourcesRouter = require('./routes/resources');
const dashboardRouter = require('./routes/dashboard');
const optimizationRouter = require('./routes/optimization');
const workordersRouter = require('./routes/workorders');
const financeRouter = require('./routes/finance');
const adminRouter = require('./routes/admin');

const app = express();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 53400;
const ALLOWED_ORIGINS = [
  'http://127.0.0.1:43400',
  'http://localhost:43400',
  'http://127.0.0.1:43401',
  'http://localhost:43401'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.request(req, res, duration);
  });
  next();
});

app.get('/api/health', (req, res) => {
  try {
    const dbStatus = db.prepare('SELECT 1').get();
    res.json(success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    }));
  } catch (err) {
    logger.error('健康检查失败', err);
    res.json(error('服务异常', 500));
  }
});

app.use('/api/bills', billsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', optimizationRouter);
app.use('/api/workorders', workordersRouter);
app.use('/api/finance', financeRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json(error('接口不存在', 404));
});

app.use((err, req, res, next) => {
  logger.error('服务器内部错误', { error: err.message, stack: err.stack });
  res.status(500).json(error(err.message || '服务器内部错误', 500));
});

app.listen(PORT, HOST, () => {
  logger.info(`服务器启动成功`, { host: HOST, port: PORT });
  console.log(`FinOps Backend running on http://${HOST}:${PORT}`);
});

module.exports = app;
