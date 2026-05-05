import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initTables } from './database/init.js';
import { CALL_STATUS } from './utils/constants.js';
import { callService } from './services/callService.js';

import accountRoutes from './routes/accountRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import callRoutes from './routes/callRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import messageCenterRoutes from './routes/messageCenterRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT) || 20774;
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 30774;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      `http://localhost:${FRONTEND_PORT}`,
      `http://127.0.0.1:${FRONTEND_PORT}`
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Weaver 视频通讯服务运行中',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/message-center', messageCenterRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

const userSocketMap = new Map();
const socketUserMap = new Map();

io.on('connection', (socket) => {
  console.log('新的 Socket 连接:', socket.id);

  socket.on('register', ({ userId }) => {
    if (userSocketMap.has(userId)) {
      const oldSocketId = userSocketMap.get(userId);
      socketUserMap.delete(oldSocketId);
    }
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);
    console.log(`用户 ${userId} 注册到 Socket: ${socket.id}`);
  });

  socket.on('call:initiate', ({ sessionId, calleeId, callerInfo }) => {
    const calleeSocketId = userSocketMap.get(calleeId.toString());
    
    if (calleeSocketId) {
      io.to(calleeSocketId).emit('call:incoming', {
        sessionId,
        callerInfo
      });
    } else {
      socket.emit('call:offline', {
        sessionId,
        message: '对方不在线'
      });
    }
  });

  socket.on('call:ringing', ({ sessionId, callerId }) => {
    const callerSocketId = userSocketMap.get(callerId.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:ringing', { sessionId });
    }
  });

  socket.on('call:answer', ({ sessionId, callerId }) => {
    const callerSocketId = userSocketMap.get(callerId.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:answered', { sessionId });
    }
    
    callService.updateSessionStatus(sessionId, CALL_STATUS.CONNECTED, new Date().toISOString());
  });

  socket.on('call:reject', ({ sessionId, callerId, reason }) => {
    const callerSocketId = userSocketMap.get(callerId.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:rejected', { sessionId, reason });
    }
    
    callService.handleCallEnd(sessionId, CALL_STATUS.REJECTED);
  });

  socket.on('call:cancel', ({ sessionId, calleeId }) => {
    const calleeSocketId = userSocketMap.get(calleeId.toString());
    if (calleeSocketId) {
      io.to(calleeSocketId).emit('call:cancelled', { sessionId });
    }
    
    callService.handleCallEnd(sessionId, CALL_STATUS.CANCELLED);
  });

  socket.on('call:end', ({ sessionId, otherUserId }) => {
    const otherSocketId = userSocketMap.get(otherUserId.toString());
    if (otherSocketId) {
      io.to(otherSocketId).emit('call:ended', { sessionId });
    }
    
    callService.handleCallEnd(sessionId, CALL_STATUS.ENDED);
  });

  socket.on('call:missed', ({ sessionId, callerId }) => {
    const callerSocketId = userSocketMap.get(callerId.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:missed', { sessionId });
    }
    
    callService.handleCallEnd(sessionId, CALL_STATUS.MISSED);
  });

  socket.on('webrtc:offer', ({ sessionId, targetId, offer }) => {
    const targetSocketId = userSocketMap.get(targetId.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:offer', { sessionId, offer });
    }
  });

  socket.on('webrtc:answer', ({ sessionId, targetId, answer }) => {
    const targetSocketId = userSocketMap.get(targetId.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:answer', { sessionId, answer });
    }
  });

  socket.on('webrtc:ice-candidate', ({ sessionId, targetId, candidate }) => {
    const targetSocketId = userSocketMap.get(targetId.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:ice-candidate', { sessionId, candidate });
    }
  });

  socket.on('message:new', ({ messageId, receiverIds }) => {
    receiverIds.forEach(receiverId => {
      const receiverSocketId = userSocketMap.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:incoming', { messageId });
      }
    });
  });

  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    if (userId) {
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);
      console.log(`用户 ${userId} 的 Socket 连接断开: ${socket.id}`);
    }
  });
});

const startServer = async () => {
  try {
    initTables();
    
    server.listen(PORT, () => {
      console.log('========================================');
      console.log('  Weaver 视频通讯服务已启动');
      console.log('========================================');
      console.log(`  后端服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/health`);
      console.log(`  Socket.IO 端口: ${PORT}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

export { io, userSocketMap };
