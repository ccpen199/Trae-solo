require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const net = require('net');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const liveRoutes = require('./routes/live');
const examRoutes = require('./routes/exams');
const adminRoutes = require('./routes/admin');
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

app.use('/api/auth', (req, res, next) => {
  if (req.path !== '/login') {
    return authenticate(req, res, next);
  }
  next();
}, authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join') {
        clients.set(ws, { courseId: data.courseId, userId: data.userId, userName: data.userName });
        broadcast(data.courseId, { type: 'system', content: `${data.userName} 加入了课堂` });
      }
      
      if (data.type === 'chat') {
        const client = clients.get(ws);
        if (client) {
          broadcast(client.courseId, { 
            type: 'chat', 
            userName: client.userName, 
            content: data.content,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      if (data.type === 'poll') {
        const client = clients.get(ws);
        if (client) {
          broadcast(client.courseId, { 
            type: 'poll',
            pollId: data.pollId,
            question: data.question
          });
        }
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });
  
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      broadcast(client.courseId, { type: 'system', content: `${client.userName} 离开了课堂` });
    }
    clients.delete(ws);
  });
});

function broadcast(courseId, message) {
  clients.forEach((client, ws) => {
    if (client.courseId === courseId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

const PORT = process.env.PORT || 3000;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startServer() {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`端口 ${PORT} 已被占用，请先释放端口或修改 .env 配置`);
    process.exit(1);
  }
  
  server.listen(PORT, () => {
    console.log(`培训系统后端服务已启动`);
    console.log(`API 地址: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
  });
}

startServer();
