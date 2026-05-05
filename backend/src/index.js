require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 23168;

app.use(cors({
  origin: ['http://localhost:33168', 'http://127.0.0.1:33168'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(uploadDir));

const authRoutes = require('./routes/auth');
const riderRoutes = require('./routes/rider');
const orderRoutes = require('./routes/order');
const scheduleRoutes = require('./routes/schedule');
const commonRoutes = require('./routes/common');

app.use('/api/auth', authRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/common', commonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`校园外卖配送系统后端服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API 前缀: http://localhost:${PORT}/api`);
});
