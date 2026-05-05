require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/device');
const controlRoutes = require('./routes/control');
const videoRoutes = require('./routes/video');
const tempRoutes = require('./routes/temperature');
const authMiddleware = require('./middleware/auth');
const db = require('./config/database');
const { initMockDevices, startTemperatureCollection } = require('./services/deviceService');
const { handleWebSocket } = require('./services/websocketService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 12250;
const UPLOAD_PATH = path.join(__dirname, '..', process.env.UPLOAD_PATH || './uploads');
const VIDEO_PATH = path.join(__dirname, '..', process.env.VIDEO_PATH || './videos');

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}
if (!fs.existsSync(VIDEO_PATH)) {
  fs.mkdirSync(VIDEO_PATH, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22501',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/devices', authMiddleware.authenticateToken, deviceRoutes);
app.use('/api/control', authMiddleware.authenticateToken, authMiddleware.requireAdmin, controlRoutes);
app.use('/api/video', authMiddleware.authenticateToken, videoRoutes);
app.use('/api/temperature', authMiddleware.authenticateToken, tempRoutes);

app.use('/uploads', express.static(UPLOAD_PATH));
app.use('/videos', express.static(VIDEO_PATH));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

wss.on('connection', (ws) => {
  handleWebSocket(ws, wss);
});

async function init() {
  try {
    await db.init();
    console.log('数据库初始化完成');
    
    initMockDevices();
    startTemperatureCollection();
    console.log('模拟设备初始化完成');
    
    server.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  智能家居远程监测与设备控制平台`);
      console.log(`========================================`);
      console.log(`  后端服务已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  WebSocket: ws://localhost:${PORT}`);
      console.log(`  端口: ${PORT}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

init();
