require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.BACKEND_PORT || 59291;
const HOST = '127.0.0.1';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49291',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const WebSocket = require('ws');
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const wsClients = new Set();
app.set('wsClients', wsClients);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data.type);
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    wsClients.delete(ws);
  });
});

app.get('/api/health', (req, res) => {
  const db = require('./config/database');
  try {
    db.prepare('SELECT 1').get();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ev-charging-platform',
      version: '1.0.0',
      database: 'connected',
      websocket_clients: wsClients.size
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: err.message
    });
  }
});

const stationsRouter = require('./routes/stations');
const chargersRouter = require('./routes/chargers');
const ordersRouter = require('./routes/orders');
const recommendationRouter = require('./routes/recommendation');
const ocppRouter = require('./routes/ocpp');
const alarmsRouter = require('./routes/alarms');
const pricingRouter = require('./routes/pricing');
const revenueRouter = require('./routes/revenue');

app.use('/api/stations', stationsRouter);
app.use('/api/chargers', chargersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/recommendation', recommendationRouter);
app.use('/api/ocpp', ocppRouter);
app.use('/api/alarms', alarmsRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/revenue', revenueRouter);

app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
=============================================
新能源汽车充电基础设施智能调度平台 - 后端服务
=============================================
服务地址: http://127.0.0.1:${PORT}
API 前缀: /api
健康检查: http://127.0.0.1:${PORT}/api/health
WebSocket: ws://127.0.0.1:${PORT}/ws
启动时间: ${new Date().toLocaleString('zh-CN')}
=============================================
  `);
});

const startSimulator = () => {
  const db = require('./config/database');
  const models = require('./models');
  
  setInterval(() => {
    const chargers = db.prepare(`
      SELECT c.*, cs.is_charging, cs.is_occupied, cs.is_offline
      FROM chargers c
      LEFT JOIN charger_status cs ON c.id = cs.charger_id
      WHERE cs.id IN (SELECT MAX(id) FROM charger_status GROUP BY charger_id)
    `).all();
    
    chargers.forEach(charger => {
      if (charger.is_offline) return;
      
      let isCharging = charger.is_charging;
      let isOccupied = charger.is_occupied;
      
      if (Math.random() < 0.05) {
        isCharging = !isCharging;
        isOccupied = isCharging ? true : (Math.random() < 0.3);
      }
      
      const voltage = isCharging ? (charger.type === 'fast' ? 380 + Math.random() * 20 : 220 + Math.random() * 10) : 0;
      const current = isCharging ? (charger.type === 'fast' ? 150 + Math.random() * 100 : 20 + Math.random() * 15) : 0;
      const power = isCharging ? (charger.type === 'fast' ? 60 + Math.random() * 60 : 5 + Math.random() * 2) : 0;
      const temperature = isCharging ? 35 + Math.random() * 15 : 25 + Math.random() * 5;
      const soc = isCharging ? 30 + Math.random() * 50 : 0;
      
      try {
        models.insertChargerStatus.run(
          charger.id,
          Math.round(voltage * 10) / 10,
          Math.round(current * 10) / 10,
          Math.round(power * 10) / 10,
          Math.round(temperature * 10) / 10,
          Math.round(soc * 10) / 10,
          null, null,
          isOccupied ? Math.floor(Math.random() * 3600) : 0,
          isOccupied ? 1 : 0,
          isCharging ? 1 : 0,
          0
        );
        
        const activeOrder = models.getActiveOrderByChargerId.get(charger.id);
        if (activeOrder && isCharging) {
          models.insertPowerData.run(
            activeOrder.id,
            charger.id,
            Math.round(voltage * 10) / 10,
            Math.round(current * 10) / 10,
            Math.round(power * 10) / 10,
            Math.round(soc * 10) / 10,
            Math.round(temperature * 10) / 10
          );
        }
        
        if (wsClients.size > 0) {
          const update = {
            type: 'charger_status',
            data: {
              charger_id: charger.id,
              charger_code: charger.charger_code,
              voltage: Math.round(voltage * 10) / 10,
              current: Math.round(current * 10) / 10,
              power: Math.round(power * 10) / 10,
              temperature: Math.round(temperature * 10) / 10,
              soc: Math.round(soc * 10) / 10,
              is_occupied: isOccupied,
              is_charging: isCharging,
              is_offline: false,
              timestamp: new Date().toISOString()
            }
          };
          
          wsClients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(update));
            }
          });
        }
      } catch (err) {
        console.error('模拟数据更新失败:', err.message);
      }
    });
  }, 5000);
  
  console.log('IoT状态模拟器已启动，每5秒更新一次充电桩状态');
};

process.nextTick(() => {
  const db = require('./config/database');
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM stations').get();
    if (count.count === 0) {
      console.log('数据库为空，开始初始化...');
      require('child_process').execSync('node scripts/init-db.js', { cwd: __dirname + '/..', stdio: 'inherit' });
      console.log('数据库表创建完成，开始填充数据...');
      require('child_process').execSync('node scripts/seed-data.js', { cwd: __dirname + '/..', stdio: 'inherit' });
      console.log('数据填充完成！');
    }
    startSimulator();
  } catch (err) {
    console.log('数据库检查失败:', err.message);
  }
});
