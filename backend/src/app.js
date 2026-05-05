require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const bookRoutes = require('./routes/bookRoutes');
const commentRoutes = require('./routes/commentRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const squareRoutes = require('./routes/squareRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22266',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/libraries', libraryRoutes);
app.use('/api/v1/square', squareRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '读书人频道后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
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
