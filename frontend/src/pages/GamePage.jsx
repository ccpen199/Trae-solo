import React, { useState, useEffect } from 'react';
import { getSocket, makeMove, getGameState } from '../utils/socket';

const TEST_PLAYER_ID = 'test-player-ai-001';

function GamePage({ user, gameId, onBack }) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [singlePlayerMode, setSinglePlayerMode] = useState(false);
  const [controllingBoth, setControllingBoth] = useState(true);
  const [aiAutoPlay, setAiAutoPlay] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      getGameState(gameId, user.id);

      socket.on('game_state', (data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setGameState(data.gameState);
          
          if (data.gameState) {
            const isAgainstAI = 
              (data.gameState.isPlayer1 && data.gameState.player2Id === TEST_PLAYER_ID) ||
              (data.gameState.isPlayer2 && data.gameState.player1Id === TEST_PLAYER_ID);
            setSinglePlayerMode(isAgainstAI);
            if (isAgainstAI) {
              setAiAutoPlay(true);
            }
          }
        }
      });

      socket.on('move_made', (data) => {
        setGameState(data.gameState);
      });

      socket.on('move_error', (data) => {
        setError(data.error);
      });

      socket.on('game_ended', (data) => {
        getGameState(gameId, user.id);
      });
    }

    return () => {
      if (socket) {
        socket.off('game_state');
        socket.off('move_made');
        socket.off('move_error');
        socket.off('game_ended');
      }
    };
  }, [gameId, user.id]);

  useEffect(() => {
    if (!aiAutoPlay || !gameState || gameState.status === 'finished') return;
    
    if (!gameState.myTurn) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, aiAutoPlay]);

  const makeAIMove = () => {
    if (!gameState || gameState.status === 'finished') return;
    
    const emptyCells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (gameState.board[r][c] === null) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const aiPlayerId = gameState.isPlayer1 ? gameState.player2Id : gameState.player1Id;
      makeMove(gameId, aiPlayerId, randomCell);
    }
  };

  const handleCellClick = (row, col) => {
    if (!gameState) return;
    if (gameState.status === 'finished') return;
    if (gameState.board[row][col] !== null) return;

    if (controllingBoth && singlePlayerMode) {
      const currentPlayerId = gameState.currentTurn;
      makeMove(gameId, currentPlayerId, { row, col });
    } else {
      if (!gameState.myTurn) return;
      makeMove(gameId, user.id, { row, col });
    }
  };

  const renderBoard = () => {
    if (!gameState) return null;
    const { board } = gameState;

    return (
      <div className="game-board">
        <div className="board-grid">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="cell"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell && (
                    <div className={`stone ${cell}`} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTurnText = () => {
    if (!gameState) return '';
    
    if (gameState.status === 'finished') {
      const isWinner = gameState.winner === user.id;
      const isAIWinner = gameState.winner === TEST_PLAYER_ID;
      
      if (isWinner) return '🎉 你赢了！';
      if (isAIWinner) return '🤖 AI获胜了！';
      return '游戏结束';
    }
    
    const currentColor = gameState.currentTurn === gameState.player1Id ? '黑棋' : '白棋';
    
    if (controllingBoth && singlePlayerMode) {
      return `当前回合: ${currentColor} 落子`;
    }
    
    if (gameState.myTurn) {
      return '轮到你落子了';
    }
    return '等待对手落子...';
  };

  const getColorText = () => {
    if (!gameState) return '';
    return gameState.myColor === 'black' ? '黑棋' : '白棋';
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="card" style={{ display: 'inline-block', textAlign: 'center' }}>
        {singlePlayerMode && (
          <div style={{ 
            padding: '12px', 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            🤖 单机测试模式
          </div>
        )}

        {gameState?.status === 'finished' && (
          <div className="game-over">
            {getTurnText()}
          </div>
        )}

        {singlePlayerMode && gameState?.status !== 'finished' && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn ${controllingBoth ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setControllingBoth(true)}
            >
              👥 控制双方
            </button>
            <button
              className={`btn ${!controllingBoth ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setControllingBoth(false)}
            >
              🧑 只控制自己
            </button>
            {!controllingBoth && (
              <button
                className={`btn ${aiAutoPlay ? 'btn-warning' : 'btn-primary'}`}
                onClick={() => setAiAutoPlay(!aiAutoPlay)}
              >
                {aiAutoPlay ? '⏸️ 停止AI' : '▶️ 启动AI自动'}
              </button>
            )}
          </div>
        )}

        {gameState?.status !== 'finished' && (
          <div className="status-bar">
            <div>
              <strong>你的棋子:</strong> {getColorText()}
              {gameState?.myColor === 'black' ? ' ⚫' : ' ⚪'}
            </div>
            <div style={{ fontWeight: 'bold', color: gameState?.myTurn || (controllingBoth && singlePlayerMode) ? '#28a745' : '#dc3545' }}>
              {getTurnText()}
            </div>
          </div>
        )}

        {renderBoard()}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {singlePlayerMode && gameState?.status !== 'finished' && controllingBoth && (
            <button
              className="btn btn-warning"
              onClick={makeAIMove}
            >
              🤖 AI随机落子
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={onBack}
          >
            返回大厅
          </button>
        </div>

        {error && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f8d7da', 
            color: '#721c24',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default GamePage;