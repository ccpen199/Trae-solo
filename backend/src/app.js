require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const orderRoutes = require('./routes/orders');
const dispatchRoutes = require('./routes/dispatch');
const gpsRoutes = require('./routes/gps');
const settlementRoutes = require('./routes/settlements');
const dictionaryRoutes = require('./routes/dictionary');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 20791;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:30791';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dictionary', dictionaryRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

const wss = new WebSocket.Server({ server, path: '/ws/gps' });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, { ws, subscriptions: [] });
  
  console.log(`WebSocket client connected: ${clientId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          if (data.vehicleId) {
            const client = clients.get(clientId);
            if (client && !client.subscriptions.includes(data.vehicleId)) {
              client.subscriptions.push(data.vehicleId);
            }
          }
          break;
        
        case 'unsubscribe':
          if (data.vehicleId) {
            const client = clients.get(clientId);
            if (client) {
              client.subscriptions = client.subscriptions.filter(id => id !== data.vehicleId);
            }
          }
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    clients.delete(clientId);
  });
});

function broadcastGPSUpdate(vehicleId, data) {
  clients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (client.subscriptions.includes(vehicleId) || client.subscriptions.includes('all')) {
        client.ws.send(JSON.stringify({
          type: 'gps_update',
          vehicleId,
          data,
          timestamp: Date.now()
        }));
      }
    }
  });
}

server.listen(PORT, () => {
  console.log(`物流运输调度管理系统 - 后端服务`);
  console.log(`====================================`);
  console.log(`HTTP 服务端口: ${PORT}`);
  console.log(`WebSocket 路径: /ws/gps`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`====================================`);
  console.log(`默认账户:`);
  console.log(`  管理员: admin / 123456`);
  console.log(`  调度员: dispatcher / 123456`);
  console.log(`  财务员: accountant / 123456`);
  console.log(`====================================`);
});

module.exports = { app, server, broadcastGPSUpdate };
