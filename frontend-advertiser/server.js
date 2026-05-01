const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8765;
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

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/campaigns', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/campaigns.html'));
});

app.get('/campaign/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/campaign-detail.html'));
});

app.get('/campaign/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/campaign-create.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/stats.html'));
});

app.get('/reconciliation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/reconciliation.html'));
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  News App Advertiser Dashboard`);
  console.log(`  Version: 1.0.0`);
  console.log(`  Port: ${PORT}`);
  console.log(`========================================`);
  console.log(`  广告主看板地址: http://localhost:${PORT}`);
  console.log(`  API 代理: ${API_BASE_URL}`);
  console.log(`========================================`);
});
