require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 111231;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/config', (req, res) => {
  res.json({
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:111230'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  地图导航与路线规划系统 - 前端服务');
  console.log('========================================');
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API 地址: ${process.env.API_BASE_URL || 'http://localhost:111230'}`);
  console.log('========================================');
});
