require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 23144;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:33144';

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./database');
const routes = require('./routes');

app.use('/api/auth', routes.auth);
app.use('/api/user', routes.user);
app.use('/api/bike', routes.bike);
app.use('/api/order', routes.order);
app.use('/api/report', routes.report);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  共享电单车后端服务已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
});

module.exports = app;
