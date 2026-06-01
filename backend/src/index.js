require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const authRoutes = require('./routes/auth');
const cameraRoutes = require('./routes/camera');
const photoRoutes = require('./routes/photos');
const communityRoutes = require('./routes/community');
const deviceRoutes = require('./routes/devices');
const filterRoutes = require('./routes/filters');

const app = express();
const PORT = process.env.PORT || 44864;

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/filters', filterRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 美颜拍摄社区后端服务已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📅 时间: ${new Date().toLocaleString()}`);
});

module.exports = app;