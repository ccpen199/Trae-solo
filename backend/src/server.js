require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const db = require('./database');
const gameLogic = require('./game/logic');
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

const BACKEND_PORT = process.env.BACKEND_PORT || 21721;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 21722;

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);

const io = new Server(server, {
  cors: {
    origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
    methods: ['GET', 'POST']
  }
});

const activeGames = new Map();
const socketToUser = new Map();
const userToSocket = new Map();
const roomToSockets = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('register', (data) => {
    const { userId } = data;
    if (userId) {
      socketToUser.set(socket.id, userId);
      userToSocket.set(userId, socket.id);
      console.log('用户注册:', userId, '->', socket.id);
    }
  });

  socket.on('join_room', (data) => {
    const { roomId, userId } = data;
    
    if (!roomToSockets.has(roomId)) {
      roomToSockets.set(roomId, new Set());
    }
    roomToSockets.get(roomId).add(socket.id);
    
    socket.join(roomId);
    console.log('用户', userId, '加入房间', roomId);
    
    io.to(roomId).emit('player_joined', {
      userId,
      socketId: socket.id
    });
  });

  socket.on('leave_room', (data) => {
    const { roomId, userId } = data;
    
    if (roomToSockets.has(roomId)) {
      roomToSockets.get(roomId).delete(socket.id);
    }
    
    socket.leave(roomId);
    
    io.to(roomId).emit('player_left', {
      userId,
      socketId: socket.id
    });
  });

  socket.on('ready_update', (data) => {
    const { roomId, userId, ready } = data;
    io.to(roomId).emit('ready_update', { userId, ready });
  });

  socket.on('start_game', (data) => {
    const { roomId, player1Id, player2Id } = data;
    
    const game = gameLogic.createNewGame(roomId, player1Id, player2Id);
    activeGames.set(game.id, game);
    
    try {
      const stmt = db.prepare(
        'INSERT INTO games (id, room_id, player1_id, player2_id, status, current_turn, board) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run(game.id, roomId, player1Id, player2Id, 'playing', player1Id, JSON.stringify(game.board));
    } catch (err) {
      console.error('保存游戏失败:', err);
    }
    
    try {
      const stmt = db.prepare('UPDATE rooms SET status = ? WHERE id = ?');
      stmt.run('playing', roomId);
    } catch (err) {
      console.error('更新房间状态失败:', err);
    }
    
    const player1State = gameLogic.getGameState(game, player1Id);
    const player2State = gameLogic.getGameState(game, player2Id);
    
    const player1Socket = userToSocket.get(player1Id);
    const player2Socket = userToSocket.get(player2Id);
    
    if (player1Socket) {
      io.to(player1Socket).emit('game_started', { gameId: game.id, gameState: player1State });
    }
    if (player2Socket) {
      io.to(player2Socket).emit('game_started', { gameId: game.id, gameState: player2State });
    }
    
    io.to(roomId).emit('game_started', { gameId: game.id });
  });

  socket.on('make_move', (data) => {
    const { gameId, playerId, move } = data;
    
    const game = activeGames.get(gameId);
    if (!game) {
      socket.emit('move_error', { error: '游戏不存在' });
      return;
    }
    
    const result = gameLogic.executeMove(game, playerId, move);
    
    if (!result.success) {
      socket.emit('move_error', { error: result.reason });
      return;
    }
    
    try {
      const stmt = db.prepare('INSERT INTO game_moves (game_id, player_id, move_data) VALUES (?, ?, ?)');
      stmt.run(gameId, playerId, JSON.stringify(move));
    } catch (err) {
      console.error('保存游戏步骤失败:', err);
    }
    
    const player1State = gameLogic.getGameState(game, game.player1Id);
    const player2State = gameLogic.getGameState(game, game.player2Id);
    
    const player1Socket = userToSocket.get(game.player1Id);
    const player2Socket = userToSocket.get(game.player2Id);
    
    if (player1Socket) {
      io.to(player1Socket).emit('move_made', { 
        playerId, 
        move, 
        gameState: player1State 
      });
    }
    if (player2Socket) {
      io.to(player2Socket).emit('move_made', { 
        playerId, 
        move, 
        gameState: player2State 
      });
    }
    
    if (result.gameOver) {
      try {
        const stmt = db.prepare('UPDATE games SET status = ?, winner_id = ?, board = ? WHERE id = ?');
        stmt.run('finished', result.winner, JSON.stringify(game.board), gameId);
      } catch (err) {
        console.error('更新游戏状态失败:', err);
      }
      
      io.to(game.roomId).emit('game_ended', {
        gameId,
        winnerId: result.winner,
        winnerColor: result.winner === game.player1Id ? 'black' : 'white'
      });
    } else {
      try {
        const stmt = db.prepare('UPDATE games SET current_turn = ?, board = ? WHERE id = ?');
        stmt.run(game.currentTurn, JSON.stringify(game.board), gameId);
      } catch (err) {
        console.error('更新游戏回合失败:', err);
      }
    }
  });

  socket.on('get_game_state', (data) => {
    const { gameId, userId } = data;
    
    const game = activeGames.get(gameId);
    if (game) {
      const state = gameLogic.getGameState(game, userId);
      socket.emit('game_state', { gameState: state });
    } else {
      try {
        const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
        const row = stmt.get(gameId);
        
        if (!row) {
          socket.emit('game_state', { error: '游戏不存在' });
          return;
        }
        
        const reconstructedGame = {
          id: row.id,
          roomId: row.room_id,
          player1Id: row.player1_id,
          player2Id: row.player2_id,
          status: row.status,
          currentTurn: row.current_turn,
          board: JSON.parse(row.board || '[]'),
          gameType: 'gomoku',
          moveHistory: [],
          winner: row.winner_id
        };
        
        const state = gameLogic.getGameState(reconstructedGame, userId);
        socket.emit('game_state', { gameState: state });
      } catch (err) {
        console.error('查询游戏状态失败:', err);
        socket.emit('game_state', { error: '查询游戏状态失败' });
      }
    }
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      console.log('用户断开:', userId);
      socketToUser.delete(socket.id);
      userToSocket.delete(userId);
      
      roomToSockets.forEach((sockets, roomId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          io.to(roomId).emit('player_disconnected', { userId, socketId: socket.id });
        }
      });
    }
  });
});

server.listen(BACKEND_PORT, () => {
  console.log(`棋牌游戏后端服务启动成功`);
  console.log(`访问地址: http://localhost:${BACKEND_PORT}`);
  console.log(`WebSocket 服务已启动`);
});