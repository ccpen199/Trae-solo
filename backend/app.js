require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const containerRoutes = require('./src/routes/containers');
const nodeRoutes = require('./src/routes/nodes');
const exceptionRoutes = require('./src/routes/exceptions');
const customerRoutes = require('./src/routes/customer');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/containers', containerRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/customer', customerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/health`);
});

module.exports = app;
