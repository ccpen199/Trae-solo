const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { router: usersRouter, authenticateToken } = require('./routes/users');
const gamesRouter = require('./routes/games');
const rankingRouter = require('./routes/ranking');
const roomsRouter = require('./routes/rooms');

const PORT = process.env.PORT || 21730;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:21731';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/ranking', rankingRouter);
app.use('/api/rooms', roomsRouter);

const activeGames = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('join-lobby', (data) => {
    socket.join('lobby');
    console.log('用户加入大厅:', data.userId);
  });

  socket.on('create-room', (data) => {
    const roomCode = data.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomCode);
    io.to('lobby').emit('room-created', {
      roomCode,
      host: socket.id,
      gameType: data.gameType
    });
    socket.emit('room-joined', { roomCode, isHost: true });
  });

  socket.on('join-room', (data) => {
    const { roomCode } = data;
    const room = io.sockets.adapter.rooms.get(roomCode);
    
    if (room && room.size > 0) {
      socket.join(roomCode);
      io.to(roomCode).emit('player-joined', {
        socketId: socket.id,
        playerData: data.playerData
      });
      socket.emit('room-joined', { roomCode, isHost: false });
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('player-ready', (data) => {
    io.to(data.roomCode).emit('player-ready-update', {
      socketId: socket.id,
      isReady: data.isReady
    });
  });

  socket.on('start-game', (data) => {
    io.to(data.roomCode).emit('game-started', {
      gameConfig: data.gameConfig
    });
  });

  socket.on('game-action', (data) => {
    io.to(data.roomCode).emit('player-action', {
      socketId: socket.id,
      action: data.action,
      payload: data.payload
    });
  });

  socket.on('submit-answer', (data) => {
    io.to(data.roomCode).emit('answer-submitted', {
      socketId: socket.id,
      questionId: data.questionId,
      answer: data.answer,
      isCorrect: data.isCorrect,
      score: data.score
    });
  });

  socket.on('game-over', (data) => {
    io.to(data.roomCode).emit('game-ended', {
      scores: data.scores,
      winner: data.winner
    });
  });

  socket.on('leave-room', (data) => {
    socket.leave(data.roomCode);
    io.to(data.roomCode).emit('player-left', {
      socketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`教育互动小游戏平台后端服务已启动`);
  console.log(`========================================`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`Socket.IO 地址: ws://localhost:${PORT}`);
  console.log(`========================================`);
  console.log(`默认测试账号:`);
  console.log(`  老师账号: teacher1 / 123456`);
  console.log(`  学生账号: student1 / 123456`);
  console.log(`  学生账号: student2 / 123456`);
  console.log(`  学生账号: student3 / 123456`);
  console.log(`========================================`);
});
