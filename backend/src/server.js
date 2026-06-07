require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const withdrawalRoutes = require('./routes/withdrawal');
const adminRoutes = require('./routes/admin');
const unitRoutes = require('./routes/unit');
const developerRoutes = require('./routes/developer');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 59037;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49037}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./database');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/unit', unitRoutes);
app.use('/api/developer', developerRoutes);

app.get(['/api/users/profile', '/api/user/profile'], authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    profile: req.user,
    message: '当前用户资料'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`公积金服务中台后端启动成功`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
