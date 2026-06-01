require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const elderlyRoutes = require('./routes/elderly');
const careRoutes = require('./routes/care');
const medicationRoutes = require('./routes/medication');
const incidentRoutes = require('./routes/incident');
const feeRoutes = require('./routes/fee');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.BACKEND_PORT || 58907;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: ['http://127.0.0.1:48907', 'http://localhost:48907'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/elderly', elderlyRoutes);
app.use('/api/care', careRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`后端服务器运行在 http://127.0.0.1:${PORT}`);
      console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
