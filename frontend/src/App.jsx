import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { initSocket } from './utils/socket';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedNickname = localStorage.getItem('nickname');
    
    if (savedUserId && savedNickname) {
      handleLogin(savedNickname, savedUserId);
    }
  }, []);

  const handleLogin = async (nickname, existingUserId) => {
    const result = await api.login(nickname, existingUserId);
    if (result.success) {
      const userData = result.user;
      setUser(userData);
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('nickname', userData.nickname);
      
      initSocket(userData.id, 
        () => setSocketConnected(true),
        () => setSocketConnected(false)
      );
      
      setCurrentPage('lobby');
    }
  };

  const handleEnterRoom = (roomData) => {
    setRoom(roomData);
    setCurrentPage('room');
  };

  const handleStartGame = (newGameId) => {
    setGameId(newGameId);
    setCurrentPage('game');
  };

  const handleBackToLobby = () => {
    setRoom(null);
    setGameId(null);
    setCurrentPage('lobby');
  };

  const handleLogout = () => {
    setUser(null);
    setRoom(null);
    setGameId(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('nickname');
    setCurrentPage('login');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🎮 棋牌游戏</h1>
        {user && (
          <p>
            当前玩家: {user.nickname} 
            {socketConnected ? ' 🟢 在线' : ' 🔴 断开'}
            <button 
              className="btn btn-secondary" style={{ marginLeft: '10px' }}
              onClick={handleLogout}
            >
              退出
            </button>
          </p>
        )}
      </div>

      {currentPage === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {currentPage === 'lobby' && user && (
        <LobbyPage 
          user={user} 
          onEnterRoom={handleEnterRoom}
        />
      )}

      {currentPage === 'room' && user && room && (
        <RoomPage 
          user={user} 
          room={room}
          onStartGame={handleStartGame}
          onBack={handleBackToLobby}
          onUpdateRoom={setRoom}
        />
      )}

      {currentPage === 'game' && user && gameId && (
        <GamePage 
          user={user} 
          gameId={gameId}
          onBack={handleBackToLobby}
        />
      )}
    </div>
  );
}

export default App;