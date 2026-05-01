const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8764;
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

app.get('/article/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/article.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  News App Reader Frontend`);
  console.log(`  Version: 1.0.0`);
  console.log(`  Port: ${PORT}`);
  console.log(`========================================`);
  console.log(`  读者端地址: http://localhost:${PORT}`);
  console.log(`  API 代理: ${API_BASE_URL}`);
  console.log(`========================================`);
});
