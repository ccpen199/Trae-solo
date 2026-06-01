const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const positionRoutes = require('./routes/positions');
const candidateRoutes = require('./routes/candidates');
const slaRoutes = require('./routes/sla');

const app = express();
const PORT = process.env.BACKEND_PORT || 50000;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 40000}`, `http://localhost:${process.env.FRONTEND_PORT || 40000}`],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/sla', slaRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`招聘外包管理平台后端服务已启动`);
  console.log(`运行地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
