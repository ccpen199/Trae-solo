require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { initDatabase } = require('./database');
const marketDataEngine = require('./market-data-engine');
const matchingEngine = require('./matching-engine');

const { router: authRouter, authenticateToken } = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const marketRouter = require('./routes/market');
const positionsRouter = require('./routes/positions');
const fundsRouter = require('./routes/funds');
const riskRouter = require('./routes/risk');
const settlementRouter = require('./routes/settlement');
const auditRouter = require('./routes/audit');

const PORT = process.env.PORT || 11085;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 11086;

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/market', marketRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/funds', fundsRouter);
app.use('/api/risk', riskRouter);
app.use('/api/settlement', settlementRouter);
app.use('/api/audit', auditRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    port: PORT,
    frontendPort: FRONTEND_PORT
  });
});

const wss = new WebSocket.Server({ server });

global.wsConnections = new Map();

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  ws.connectionId = connectionId;
  global.wsConnections.set(connectionId, ws);

  console.log(`WebSocket 连接已建立: ${connectionId}`);

  ws.send(JSON.stringify({
    type: 'connection_established',
    data: {
      connectionId,
      message: 'WebSocket 连接已建立'
    },
    timestamp: Date.now()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          handleSubscribe(ws, data);
          break;
        case 'unsubscribe':
          handleUnsubscribe(ws, data);
          break;
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;
        default:
          console.log('未知的 WebSocket 消息类型:', data.type);
      }
    } catch (error) {
      console.error('解析 WebSocket 消息错误:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket 连接已关闭: ${connectionId}`);
    global.wsConnections.delete(connectionId);
    marketDataEngine.removeConnection(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket 错误 (${connectionId}):`, error);
    global.wsConnections.delete(connectionId);
  });
});

function handleSubscribe(ws, data) {
  const { subscriptionType, securityCode } = data;
  
  if (subscriptionType === 'market_data' && securityCode) {
    const latestData = marketDataEngine.subscribe(
      ws.connectionId,
      'market_data',
      securityCode
    );

    if (latestData) {
      ws.send(JSON.stringify({
        type: 'market_data',
        data: latestData,
        timestamp: Date.now()
      }));
    }

    console.log(`订阅行情: ${securityCode} (连接: ${ws.connectionId})`);
  }
}

function handleUnsubscribe(ws, data) {
  const { subscriptionType, securityCode } = data;
  
  if (subscriptionType === 'market_data' && securityCode) {
    marketDataEngine.unsubscribe(
      ws.connectionId,
      'market_data',
      securityCode
    );

    console.log(`取消订阅行情: ${securityCode} (连接: ${ws.connectionId})`);
  }
}

function broadcastOrderUpdate(orderId, eventType, data) {
  const message = JSON.stringify({
    type: eventType,
    data: {
      orderId,
      ...data
    },
    timestamp: Date.now()
  });

  global.wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error('广播订单更新失败:', err);
      }
    }
  });
}

function broadcastTradeUpdate(tradeData) {
  const message = JSON.stringify({
    type: 'trade_executed',
    data: tradeData,
    timestamp: Date.now()
  });

  global.wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error('广播成交更新失败:', err);
      }
    }
  });
}

app.use((err, req, res, next) => {
  console.error('未处理的错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

async function startServer() {
  try {
    console.log('正在初始化数据库...');
    initDatabase();

    console.log('正在初始化行情引擎...');
    marketDataEngine.initialize();

    console.log('正在初始化撮合引擎...');
    matchingEngine.initialize();

    server.listen(PORT, () => {
      console.log('\n========================================');
      console.log('    证券行情交易系统后端服务启动成功');
      console.log('========================================');
      console.log(`\nHTTP 服务地址: http://localhost:${PORT}`);
      console.log(`WebSocket 地址: ws://localhost:${PORT}`);
      console.log(`前端服务地址: http://localhost:${FRONTEND_PORT}`);
      console.log(`\nAPI 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`\n启动时间: ${new Date().toISOString()}`);
      console.log('\n========================================\n');
    });

  } catch (error) {
    console.error('启动服务失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { broadcastOrderUpdate, broadcastTradeUpdate };
