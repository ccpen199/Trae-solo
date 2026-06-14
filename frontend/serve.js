require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.FRONTEND_PORT) || 49034;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 59034;

app.use('/api', createProxyMiddleware({
  target: `http://127.0.0.1:${BACKEND_PORT}`,
  changeOrigin: true
}));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`前端服务器运行在 http://127.0.0.1:${PORT}`);
  console.log(`API代理到 http://127.0.0.1:${BACKEND_PORT}`);
});
