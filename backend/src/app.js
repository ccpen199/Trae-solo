require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initWebSocket, getWebSocketServer } = require('./services/websocketServer');
const AnomalyDetector = require('./services/anomalyDetector');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const studentRoutes = require('./routes/students');
const transactionRoutes = require('./routes/transactions');
const alertRoutes = require('./routes/alerts');
const workOrderRoutes = require('./routes/workorders');
const buildingRoutes = require('./routes/buildings');
const energyRoutes = require('./routes/energy');
const otaRoutes = require('./routes/ota');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '校园热水IoT服务管理平台 API 运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    websocketClients: getWebSocketServer()?.getConnectedClients() || 0
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/ota', otaRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

initWebSocket(server);

connectDB().then(() => {
  const anomalyDetector = new AnomalyDetector();
  anomalyDetector.init().then(() => {
    anomalyDetector.start();
  });
});

module.exports = { app, server };
