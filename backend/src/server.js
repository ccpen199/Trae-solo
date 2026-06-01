require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const dailyRoutes = require('./routes/daily');
const focusRoutes = require('./routes/focus');
const sleepRoutes = require('./routes/sleep');
const breathRoutes = require('./routes/breath');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.BACKEND_PORT || 45846;

app.use(cors({
  origin: ['http://localhost:44846', 'http://127.0.0.1:44846'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(authenticateToken);

app.use('/api/auth', authRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/breath', breathRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 潮汐后端服务已启动`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🔗 API 前缀: http://localhost:${PORT}/api`);
});

module.exports = app;
