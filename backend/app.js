const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const responseHandler = require('./middleware/response');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 48421;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:48422',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

app.get('/api/health', (req, res) => {
  res.success({ status: 'ok', timestamp: Date.now() }, '服务正常运行');
});

app.use('/api/users', require('./routes/users'));
app.use('/api/bank-cards', require('./routes/bankCards'));
app.use('/api/qrcode', require('./routes/qrcode'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/notifications', require('./routes/notifications'));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📦 数据库路径: ${path.resolve(process.env.DB_PATH || './data/app.sqlite')}`);
});

module.exports = app;
