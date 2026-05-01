const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8763;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8762';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', createProxyMiddleware({
  target: API_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v1'
  },
  logLevel: 'debug'
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/contents', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contents.html'));
});

app.get('/content/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/content-edit.html'));
});

app.get('/content/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/content-edit.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/analytics.html'));
});

app.get('/ads', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/ads.html'));
});

app.get('/audit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/audit.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/users.html'));
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  News App Admin Frontend`);
  console.log(`  Version: 1.0.0`);
  console.log(`  Port: ${PORT}`);
  console.log(`========================================`);
  console.log(`  管理后台地址: http://localhost:${PORT}`);
  console.log(`  API 代理: ${API_BASE_URL}`);
  console.log(`========================================`);
});
