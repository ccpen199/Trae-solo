require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const { authenticateToken } = require('./middleware/auth');

const translationRoutes = require('./routes/translation');
const authRoutes = require('./routes/auth');
const dailyRoutes = require('./routes/daily');
const wordbookRoutes = require('./routes/wordbook');
const discoverRoutes = require('./routes/discover');

const app = express();
const PORT = process.env.PORT || 48091;

app.use(cors({
  origin: ['http://localhost:48092', 'http://127.0.0.1:48092'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initDatabase();

app.use('/api/auth', authenticateToken, authRoutes);
app.use('/api/translate', authenticateToken, translationRoutes);
app.use('/api/daily', authenticateToken, dailyRoutes);
app.use('/api/wordbook', authenticateToken, wordbookRoutes);
app.use('/api/discover', authenticateToken, discoverRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`
=========================================
海词词典后端服务已启动
端口: ${PORT}
API地址: http://localhost:${PORT}/api
健康检查: http://localhost:${PORT}/api/health
=========================================
  `);
});
