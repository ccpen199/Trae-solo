require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socialRoutes = require('./routes/social');
const userRoutes = require('./routes/users');
const movieRoutes = require('./routes/movies');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 47711;

app.use(cors({
  origin: ['http://localhost:47712', 'http://127.0.0.1:47712'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '微光服务运行正常', timestamp: new Date().toISOString() });
});

const userSockets = new Map();

wss.on('connection', (ws) => {
  console.log('WebSocket 连接建立');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'auth') {
        userSockets.set(data.userId, ws);
        ws.userId = data.userId;
        console.log(`用户 ${data.userId} 已连接`);
      } else if (data.type === 'room_message' && ws.userId) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'room_message',
              roomId: data.roomId,
              message: data.message
            }));
          }
        });
      }
    } catch (error) {
      console.error('WebSocket 消息处理错误:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      userSockets.delete(ws.userId);
      console.log(`用户 ${ws.userId} 已断开连接`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

server.listen(PORT, () => {
  console.log(`
=========================================
    微光服务已启动
    后端地址: http://localhost:${PORT}
    WebSocket: ws://localhost:${PORT}/ws
    启动时间: ${new Date().toLocaleString()}
=========================================
  `);
});
