import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const initSocket = (userId, onConnect, onDisconnect) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:21721', {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('register', { userId });
    if (onConnect) onConnect();
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    if (onDisconnect) onDisconnect();
  });

  return socket;
};

export const joinRoom = (roomId, userId) => {
  if (socket) {
    socket.emit('join_room', { roomId, userId });
  }
};

export const leaveRoom = (roomId, userId) => {
  if (socket) {
    socket.emit('leave_room', { roomId, userId });
  }
};

export const sendReadyUpdate = (roomId, userId, ready) => {
  if (socket) {
    socket.emit('ready_update', { roomId, userId, ready });
  }
};

export const startGame = (roomId, player1Id, player2Id) => {
  if (socket) {
    socket.emit('start_game', { roomId, player1Id, player2Id });
  }
};

export const makeMove = (gameId, playerId, move) => {
  if (socket) {
    socket.emit('make_move', { gameId, playerId, move });
  }
};

export const getGameState = (gameId, userId) => {
  if (socket) {
    socket.emit('get_game_state', { gameId, userId });
  }
};