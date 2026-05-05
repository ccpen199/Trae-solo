require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3140;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: ['http://localhost:4140', 'http://127.0.0.1:4140'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initDB = require('./config/database');
const db = initDB();

app.use((req, res, next) => {
  req.db = db;
  next();
});

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const productRoutes = require('./routes/product');
const fuelRoutes = require('./routes/fuel');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/product', productRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`易捷加油后端服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api/health`);
});

module.exports = app;
