import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomDetailPage from './pages/RoomDetailPage';
import HelpPage from './pages/HelpPage';
import FollowingRoomsPage from './pages/FollowingRoomsPage';
import MyPage from './pages/MyPage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === '/help') return 'help';
    if (location.pathname === '/friends') return 'friends';
    if (location.pathname === '/my') return 'my';
    return 'home';
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:id" element={<RoomDetailPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/friends" element={<FollowingRoomsPage />} />
        <Route path="/my" element={<MyPage />} />
      </Routes>

      <nav className="nav-bar">
        <button 
          className={`nav-item ${getActiveTab() === 'home' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="nav-icon">🏠</span>
          <span>首页</span>
        </button>
        <button 
          className={`nav-item ${getActiveTab() === 'friends' ? 'active' : ''}`}
          onClick={() => navigate('/friends')}
        >
          <span className="nav-icon">👥</span>
          <span>好友</span>
        </button>
        <button 
          className={`nav-item ${getActiveTab() === 'my' ? 'active' : ''}`}
          onClick={() => navigate('/my')}
        >
          <span className="nav-icon">👤</span>
          <span>我的</span>
        </button>
        <button 
          className={`nav-item ${getActiveTab() === 'help' ? 'active' : ''}`}
          onClick={() => navigate('/help')}
        >
          <span className="nav-icon">❓</span>
          <span>帮助</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
