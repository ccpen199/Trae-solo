require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const liveRoutes = require('./routes/live');
const activityRoutes = require('./routes/activities');
const musicRoutes = require('./routes/music');
const rankingRoutes = require('./routes/ranking');
const walletRoutes = require('./routes/wallet');

const app = express();
const PORT = process.env.PORT || 48261;

app.use(cors({
  origin: ['http://localhost:48262', 'http://127.0.0.1:48262'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Keep Fitness API is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Keep Fitness 后端服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`✅ 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
