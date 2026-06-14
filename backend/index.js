#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const recordRoutes = require('./routes/records');
const statsRoutes = require('./routes/stats');

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT) || 3001;
const HOST = process.env.BACKEND_HOST || process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();

app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'gov-service-backend', port: PORT, time: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'gov-service-backend', port: PORT, time: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    code: 0,
    message: '成都都市圈政务服务平台 API',
    data: {
      version: '1.0.0',
      endpoints: [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/me',
        '/api/services',
        '/api/services/:id',
        '/api/services/:id/submit',
        '/api/records',
        '/api/stats/dashboard',
        '/api/stats/heatmap',
        '/api/stats/bureaus',
      ],
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, _next) => {
  console.error('[API][error]', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null,
  });
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: `接口不存在: ${req.method} ${req.path}`, data: null });
});

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 成都都市圈政务服务平台 API 服务已启动`);
  console.log(`   监听地址: http://${HOST}:${PORT}`);
  console.log(`   健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`   API 文档: http://${HOST}:${PORT}/api`);
  console.log(`   CORS 允许: ${CORS_ORIGIN}\n`);
});
