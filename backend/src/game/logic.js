const { v4: uuidv4 } = require('uuid');

const GAME_TYPES = {
  CHESS: 'chess',
  CHECKERS: 'checkers',
  GOMOKU: 'gomoku'
};

const createNewGame = (roomId, player1Id, player2Id, gameType = GAME_TYPES.GOMOKU) => {
  const game = {
    id: uuidv4(),
    roomId,
    player1Id,
    player2Id,
    status: 'playing',
    currentTurn: player1Id,
    player1Hand: [],
    player2Hand: [],
    board: initializeBoard(gameType),
    gameType,
    moveHistory: [],
    winner: null
  };
  return game;
};

const initializeBoard = (gameType) => {
  switch (gameType) {
    case GAME_TYPES.GOMOKU:
      return Array(15).fill(null).map(() => Array(15).fill(null));
    case GAME_TYPES.CHESS:
      return [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];
    default:
      return Array(15).fill(null).map(() => Array(15).fill(null));
  }
};

const validateMove = (game, playerId, move) => {
  if (game.currentTurn !== playerId) {
    return { valid: false, reason: '不是你的回合' };
  }

  if (game.status !== 'playing') {
    return { valid: false, reason: '游戏已结束' };
  }

  switch (game.gameType) {
    case GAME_TYPES.GOMOKU:
      return validateGomokuMove(game, playerId, move);
    default:
      return { valid: false, reason: '不支持的游戏类型' };
  }
};

const validateGomokuMove = (game, playerId, move) => {
  const { row, col } = move;
  
  if (row < 0 || row >= 15 || col < 0 || col >= 15) {
    return { valid: false, reason: '位置超出范围' };
  }
  
  if (game.board[row][col] !== null) {
    return { valid: false, reason: '该位置已有棋子' };
  }
  
  return { valid: true };
};

const executeMove = (game, playerId, move) => {
  const validation = validateMove(game, playerId, move);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  const piece = game.player1Id === playerId ? 'black' : 'white';
  
  switch (game.gameType) {
    case GAME_TYPES.GOMOKU:
      game.board[move.row][move.col] = piece;
      break;
  }

  game.moveHistory.push({
    playerId,
    move,
    piece,
    timestamp: Date.now()
  });

  const winResult = checkWin(game, playerId, move);
  if (winResult.win) {
    game.status = 'finished';
    game.winner = playerId;
    return { success: true, gameOver: true, winner: playerId };
  }

  game.currentTurn = game.currentTurn === game.player1Id ? game.player2Id : game.player1Id;
  
  return { success: true, gameOver: false };
};

const checkWin = (game, playerId, lastMove) => {
  const piece = game.player1Id === playerId ? 'black' : 'white';
  
  switch (game.gameType) {
    case GAME_TYPES.GOMOKU:
      return checkGomokuWin(game.board, lastMove.row, lastMove.col, piece);
    default:
      return { win: false };
  }
};

const checkGomokuWin = (board, row, col, piece) => {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    
    for (let i = 1; i < 5; i++) {
      const newRow = row + dr * i;
      const newCol = col + dc * i;
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
          board[newRow][newCol] === piece) {
        count++;
      } else {
        break;
      }
    }
    
    for (let i = 1; i < 5; i++) {
      const newRow = row - dr * i;
      const newCol = col - dc * i;
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
          board[newRow][newCol] === piece) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 5) {
      return { win: true, direction: [dr, dc], count };
    }
  }
  
  return { win: false };
};

const getGameState = (game, playerId) => {
  const isPlayer1 = game.player1Id === playerId;
  const isPlayer2 = game.player2Id === playerId;
  
  return {
    gameId: game.id,
    gameType: game.gameType,
    status: game.status,
    currentTurn: game.currentTurn,
    myTurn: game.currentTurn === playerId,
    board: game.board,
    isPlayer1,
    isPlayer2,
    player1Id: game.player1Id,
    player2Id: game.player2Id,
    myColor: isPlayer1 ? 'black' : (isPlayer2 ? 'white' : null),
    moveHistory: game.moveHistory,
    winner: game.winner
  };
};

module.exports = {
  GAME_TYPES,
  createNewGame,
  validateMove,
  executeMove,
  checkWin,
  getGameState
};