require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const userRoutes = require('./routes/user');
const liveRoutes = require('./routes/live');
const { queryOne, run, query } = require('./database');

const app = express();
const PORT = process.env.PORT_BACKEND || 47801;

app.use(cors({
  origin: ['http://localhost:47802', 'http://127.0.0.1:47802', 'http://localhost:47803', 'http://127.0.0.1:47803'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/live', liveRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/live' });

const liveSockets = new Map();

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const roomId = urlParams.get('roomId');
  const userId = urlParams.get('userId');

  if (!roomId) {
    ws.close();
    return;
  }

  const roomKey = `room_${roomId}`;
  if (!liveSockets.has(roomKey)) {
    liveSockets.set(roomKey, new Set());
  }
  liveSockets.get(roomKey).add({ ws, userId });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'chat' && userId) {
        const user = await queryOne('SELECT nickname, avatar, level FROM users WHERE id = ?', [userId]);
        if (user) {
          const chatMessage = {
            type: 'chat',
            user: { id: userId, ...user },
            content: message.content,
            timestamp: new Date().toISOString()
          };
          
          broadcastToRoom(roomKey, chatMessage);
        }
      } else if (message.type === 'gift' && userId) {
        const user = await queryOne('SELECT nickname, avatar FROM users WHERE id = ?', [userId]);
        if (user) {
          const giftMessage = {
            type: 'gift',
            user: { id: userId, ...user },
            gift: message.gift,
            count: message.count,
            timestamp: new Date().toISOString()
          };
          
          broadcastToRoom(roomKey, giftMessage);
        }
      } else if (message.type === 'heartbeat') {
        ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
      }
    } catch (error) {
      console.error('WebSocket消息处理错误:', error);
    }
  });

  ws.on('close', () => {
    const room = liveSockets.get(roomKey);
    if (room) {
      room.forEach((client, index, set) => {
        if (client.ws === ws) {
          set.delete(client);
        }
      });
      if (room.size === 0) {
        liveSockets.delete(roomKey);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
});

function broadcastToRoom(roomKey, message) {
  const room = liveSockets.get(roomKey);
  if (room) {
    room.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
}

server.listen(PORT, () => {
  console.log(`猫耳FM后端服务已启动`);
  console.log(`HTTP服务: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws/live`);
  console.log(`数据库路径: ${path.join(__dirname, '../data/app.sqlite')}`);
});

module.exports = { app, server, wss };
