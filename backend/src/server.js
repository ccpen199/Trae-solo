require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const containersRoute = require('./routes/containers');
const nodesRoute = require('./routes/nodes');
const exceptionsRoute = require('./routes/exceptions');
const customerRoute = require('./routes/customer');

const PORT = process.env.BACKEND_PORT || 58823;
const HOST = '127.0.0.1';

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48823}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/containers', containersRoute);
app.use('/api/nodes', nodesRoute);
app.use('/api/exceptions', exceptionsRoute);
app.use('/api/customer', customerRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/health`);
});
