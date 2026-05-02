import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { playerApi, healthApi } from './api';
import PlayerSelect from './pages/PlayerSelect';
import Lobby from './pages/Lobby';
import Battle from './pages/Battle';
import History from './pages/History';
import Trace from './pages/Trace';
import './App.css';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};

function App() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [healthStatus, setHealthStatus] = useState('未知');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthApi.check();
        setHealthStatus(response.data.success ? '正常' : '异常');
      } catch (error) {
        setHealthStatus('连接失败');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const loginPlayer = (player) => {
    setCurrentPlayer(player);
    localStorage.setItem('currentPlayer', JSON.stringify(player));
  };

  const logoutPlayer = () => {
    setCurrentPlayer(null);
    localStorage.removeItem('currentPlayer');
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validatePlayer = async () => {
      const savedPlayer = localStorage.getItem('currentPlayer');
      if (!savedPlayer) {
        setIsLoading(false);
        return;
      }

      try {
        const player = JSON.parse(savedPlayer);
        const response = await playerApi.get(player.id);
        if (response.data.success) {
          setCurrentPlayer(response.data.data);
        } else {
          localStorage.removeItem('currentPlayer');
          setCurrentPlayer(null);
        }
      } catch {
        localStorage.removeItem('currentPlayer');
        setCurrentPlayer(null);
      }
      setIsLoading(false);
    };

    validatePlayer();
  }, []);

  return (
    <PlayerContext.Provider value={{ currentPlayer, setCurrentPlayer, loginPlayer, logoutPlayer }}>
      <Router>
        <div className="app">
          <header className="header">
            <div className="header-content">
              <h1 className="title">🎮 游戏匹配对战系统</h1>
              <div className="header-right">
                <span className={`health-status ${healthStatus === '正常' ? 'ok' : 'error'}`}>
                  服务器: {healthStatus}
                </span>
                {currentPlayer && (
                  <div className="user-info">
                    <span className="tier-badge tier-{currentPlayer.tier}">{currentPlayer.tier_name}</span>
                    <span className="user-name">{currentPlayer.name}</span>
                    <button className="logout-btn" onClick={logoutPlayer}>退出</button>
                  </div>
                )}
              </div>
            </div>
            {currentPlayer && (
              <nav className="nav">
                <Link to="/" className="nav-link">匹配大厅</Link>
                <Link to="/history" className="nav-link">对战历史</Link>
                <Link to="/trace" className="nav-link">单据追踪</Link>
              </nav>
            )}
          </header>
          <main className="main">
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="loading-spinner"></div>
                <span className="text-muted" style={{ marginLeft: '1rem' }}>加载中...</span>
              </div>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={currentPlayer ? <Lobby /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/login"
                  element={!currentPlayer ? <PlayerSelect /> : <Navigate to="/" replace />}
                />
                <Route
                  path="/battle/:battleId"
                  element={currentPlayer ? <Battle /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/history"
                  element={currentPlayer ? <History /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/trace"
                  element={currentPlayer ? <Trace /> : <Navigate to="/login" replace />}
                />
              </Routes>
            )}
          </main>
          <footer className="footer">
            <p>游戏匹配对战系统 v1.0.0 | 匹配规则: 段位差≤1, 战力差≤100, 胜率差≤5%</p>
          </footer>
        </div>
      </Router>
    </PlayerContext.Provider>
  );
}

export default App;