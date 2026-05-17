require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db');

const app = express();
const PORT = process.env.PORT || 48171;

app.use(cors({
  origin: ['http://localhost:48172', 'http://127.0.0.1:48172'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/poems', require('./routes/poems'));
app.use('/api/community', require('./routes/community'));
app.use('/api/user', require('./routes/user'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 西窗烛后端服务启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
