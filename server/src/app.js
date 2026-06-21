const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
require('./config/database');
const wss = require('./websocket/streamServer');

const { encryptStreamMiddleware, decryptRequestMiddleware } = require('./utils/sm4');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted', 'X-SM4-Encrypt', 'X-Temp-Token', 'X-Real-IP']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(decryptRequestMiddleware());
app.use(encryptStreamMiddleware());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/static', express.static(path.join(__dirname, '../uploads/snapshots')));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      wsConnected: {
        devices: wss.deviceConnections.size,
        users: wss.userConnections.size,
        clients: Array.from(wss.wss.clients).filter(c => c.connectionType === 'client').length
      }
    }
  });
});

const userRoutes = require('./routes/user');
const deviceRoutes = require('./routes/device');
const streamRoutes = require('./routes/stream');

app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/stream', streamRoutes);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

const dirs = [config.uploadPath, config.recordPath, path.join(config.uploadPath, 'snapshots')];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(config.port, config.host, () => {
  console.log(`Server started on port ${config.port}`);
  console.log(`HTTP API: http://${config.host}:${config.port}`);
  console.log(`WebSocket: ws://${config.host}:${config.wsPort}`);
});

module.exports = app;
