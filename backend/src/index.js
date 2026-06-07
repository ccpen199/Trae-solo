require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const socialSecurityRoutes = require('./routes/socialSecurity');
const aiServiceRoutes = require('./routes/aiService');
const complianceRoutes = require('./routes/compliance');
const enterpriseRoutes = require('./routes/enterprise');
const mallRoutes = require('./routes/mall');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 58993;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 48993;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/social-security', socialSecurityRoutes);
app.use('/api/ai', aiServiceRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || '服务器内部错误',
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'API不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Frontend allowed from: http://127.0.0.1:${FRONTEND_PORT}`);
});
