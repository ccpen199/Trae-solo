require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58942;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48942}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/workorders', require('./routes/workorders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/health', require('./routes/health'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'gd-gov-backend' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`广东省政务服务平台后端服务已启动`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`API路径: http://127.0.0.1:${PORT}/api`);
});

module.exports = app;
