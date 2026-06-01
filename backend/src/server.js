require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 53380;
const HOST = '127.0.0.1';

app.use(cors({
  origin: [`http://${HOST}:${process.env.FRONTEND_PORT || 43380}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);

app.use('/api/applications', require('./routes/applications'));
app.use('/api/configs', require('./routes/configs'));
app.use('/api/executions', require('./routes/executions'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), user: req.user });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   Webhook 调试控制台 - 后端服务                              ║
╠══════════════════════════════════════════════════════════════╣
║   服务地址: http://${HOST}:${PORT}                           ║
║   监听地址: ${HOST}:${PORT}                                  ║
║   数据库: SQLite (./data/app.sqlite)                        ║
║   启动时间: ${new Date().toLocaleString()}                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
