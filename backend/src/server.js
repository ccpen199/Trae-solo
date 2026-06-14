const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const quotationsRoutes = require('./routes/quotations');
const projectsRoutes = require('./routes/projects');
const erpRoutes = require('./routes/erp');
const managerRoutes = require('./routes/manager');
const adminRoutes = require('./routes/admin');
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 59083;
const HOST = process.env.HOST || '127.0.0.1';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:49083',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    code: 200, 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'renovation-platform-backend'
  });
});

app.use('/api/auth', authRoutes);
app.get(['/api/users/profile', '/api/user/profile'], auth, (req, res) => {
  res.json({ code: 200, data: req.user });
});
app.use('/api/cases', casesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    code: 500, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log('  装修产业互联网设计协同平台 - 后端服务');
  console.log('========================================');
  console.log(`  服务地址: http://${HOST}:${PORT}`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`  CORS源:  ${process.env.CORS_ORIGIN || 'http://127.0.0.1:49083'}`);
  console.log('========================================');
});
