import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getSocket, joinRoom, leaveRoom, sendReadyUpdate, startGame } from '../utils/socket';

const TEST_PLAYER_ID = 'test-player-ai-001';
const TEST_PLAYER_NICKNAME = 'AI测试玩家';

function RoomPage({ user, room: initialRoom, onStartGame, onBack, onUpdateRoom }) {
  const [room, setRoom] = useState(initialRoom);
  const [isReady, setIsReady] = useState(false);
  const [testPlayerReady, setTestPlayerReady] = useState(false);
  const [isSinglePlayerMode, setIsSinglePlayerMode] = useState(false);

  const isPlayer1 = room.player1Id === user.id;
  const isPlayer2 = room.player2Id === user.id;
  const isTestPlayerInRoom = room.player2Id === TEST_PLAYER_ID;
  const isHost = room.hostId === user.id;
  const allReady = room.player1Ready && room.player2Ready;
  const hasTwoPlayers = room.player1Id && room.player2Id;

  useEffect(() => {
    joinRoom(room.id, user.id);

    const socket = getSocket();
    if (socket) {
      socket.on('player_joined', async (data) => {
        const result = await api.getRoom(room.id);
        if (result.room) {
          setRoom(result.room);
          onUpdateRoom(result.room);
        }
      });

      socket.on('player_left', async (data) => {
        const result = await api.getRoom(room.id);
        if (result.room) {
          setRoom(result.room);
          onUpdateRoom(result.room);
        }
      });

      socket.on('ready_update', async (data) => {
        const result = await api.getRoom(room.id);
        if (result.room) {
          setRoom(result.room);
          onUpdateRoom(result.room);
        }
      });

      socket.on('game_started', (data) => {
        onStartGame(data.gameId);
      });
    }

    return () => {
      leaveRoom(room.id, user.id);
      if (socket) {
        socket.off('player_joined');
        socket.off('player_left');
        socket.off('ready_update');
        socket.off('game_started');
      }
    };
  }, []);

  const handleAddTestPlayer = async () => {
    await api.login(TEST_PLAYER_NICKNAME, TEST_PLAYER_ID);
    const result = await api.joinRoom(room.id, TEST_PLAYER_ID);
    if (result.success) {
      setRoom(result.room);
      onUpdateRoom(result.room);
      setIsSinglePlayerMode(true);
    }
  };

  const handleTestPlayerReady = async () => {
    const newReadyState = !testPlayerReady;
    setTestPlayerReady(newReadyState);
    const result = await api.setReady(room.id, TEST_PLAYER_ID, newReadyState);
    if (result.success) {
      setRoom(result.room);
      onUpdateRoom(result.room);
    }
  };

  const handleReady = async () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    const result = await api.setReady(room.id, user.id, newReadyState);
    if (result.success) {
      sendReadyUpdate(room.id, user.id, newReadyState);
      setRoom(result.room);
      onUpdateRoom(result.room);
    }
  };

  const handleStartGame = () => {
    if (isHost && allReady && hasTwoPlayers) {
      startGame(room.id, room.player1Id, room.player2Id);
    }
  };

  const PlayerSlot = ({ playerId, isReady, label }) => {
    const isMe = playerId === user.id;
    const isTestPlayer = playerId === TEST_PLAYER_ID;
    const playerLabel = playerId ? (isMe ? '你' : (isTestPlayer ? 'AI测试玩家' : '对手')) : '等待加入';
    
    return (
      <div className={`player-slot ${isReady ? 'ready' : ''}`}>
        <div className="player-avatar">
          {playerId ? (isMe ? user.nickname[0].toUpperCase() : (isTestPlayer ? 'AI' : '?')) : '?'}
        </div>
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {label}: {playerLabel}
          </div>
          {playerId && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {isMe ? `(${user.nickname})` : (isTestPlayer ? `(${TEST_PLAYER_NICKNAME})` : '')}
              {isReady && <span className="ready-badge">已准备</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>
          🏠 {room.name}
        </h2>
        <p style={{ textAlign: 'center', color: '#666' }}>
          房间号: {room.id.substring(0, 8)}...
          {isSinglePlayerMode && <span style={{ marginLeft: '10px', color: '#11998e', fontWeight: 'bold' }}>[单机测试模式]</span>}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px' }}>
        <PlayerSlot 
          playerId={room.player1Id} 
          isReady={room.player1Ready}
          label="玩家1 (黑棋)"
        />
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', color: '#999' }}>
          VS
        </div>
        <PlayerSlot 
          playerId={room.player2Id} 
          isReady={room.player2Ready}
          label="玩家2 (白棋)"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!hasTwoPlayers && isHost && (
          <button
            className="btn btn-primary"
            onClick={handleAddTestPlayer}
          >
            🤖 添加AI测试玩家
          </button>
        )}

        {hasTwoPlayers && (
          <button
            className={`btn ${isReady ? 'btn-warning' : 'btn-success'}`}
            onClick={handleReady}
          >
            {isReady ? '取消准备' : '准备就绪'}
          </button>
        )}

        {isTestPlayerInRoom && (
          <button
            className={`btn ${testPlayerReady ? 'btn-warning' : 'btn-success'}`}
            onClick={handleTestPlayerReady}
            style={{ background: testPlayerReady ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #f093fb 0%, #c471ed 100%)' }}
          >
            🤖 {testPlayerReady ? '取消AI准备' : 'AI准备就绪'}
          </button>
        )}
        
        {isHost && (
          <button
            className="btn btn-primary"
            onClick={handleStartGame}
            disabled={!allReady || !hasTwoPlayers}
          >
            开始游戏
          </button>
        )}
        
        <button
          className="btn btn-secondary"
          onClick={onBack}
        >
          返回大厅
        </button>
      </div>

      {!hasTwoPlayers && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
          等待另一位玩家加入... 或点击"添加AI测试玩家"进行单机测试
        </p>
      )}
      
      {hasTwoPlayers && !allReady && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
          双方准备好后点击"准备就绪"
        </p>
      )}
      
      {allReady && !isHost && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#28a745', fontWeight: 'bold' }}>
          等待房主开始游戏...
        </p>
      )}
    </div>
  );
}

export default RoomPage;