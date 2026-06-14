require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const orderRoutes = require('./routes/orders');
const settlementRoutes = require('./routes/settlements');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59084;
const HOST = '127.0.0.1';

const corsOptions = {
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 49084}`,
    `http://localhost:${process.env.FRONTEND_PORT || 49084}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`========================================`);
  console.log(`  Task Match Platform Backend`);
  console.log(`========================================`);
  console.log(`  Server running at: http://${HOST}:${PORT}`);
  console.log(`  Health check:     http://${HOST}:${PORT}/api/health`);
  console.log(`  API base URL:     http://${HOST}:${PORT}/api`);
  console.log(`  Database:         SQLite (${process.env.DB_PATH || './data/app.sqlite'})`);
  console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  db.close();
  process.exit(0);
});

module.exports = app;
