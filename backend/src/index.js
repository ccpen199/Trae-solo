require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./models/database');

const authRoutes = require('./routes/auth');
const housesRoutes = require('./routes/houses');
const sessionsRoutes = require('./routes/sessions');
const messagesRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 18101;

app.use(cors({
  origin: ['http://localhost:18102', 'http://127.0.0.1:18102'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/houses', housesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/messages', messagesRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API接口不存在' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  房屋3D看房系统后端服务已启动`);
  console.log(`========================================`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  数据库: SQLite (data/app.sqlite)`);
  console.log(`========================================\n`);
});

module.exports = app;
