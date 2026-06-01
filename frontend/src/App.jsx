import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReadingPage from './pages/ReadingPage';
import CloudPage from './pages/CloudPage';
import ProfilePage from './pages/ProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';
import DetailPage from './pages/DetailPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/reading', icon: '📚', label: '阅读' },
    { path: '/cloud', icon: '☁️', label: '网盘' },
    { path: '/profile', icon: '👤', label: '我的' }
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { showLoginModal, setShowLoginModal } = useAuth();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/cloud" element={<CloudPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/shortcut/:name" element={<DetailPage type="shortcut" />} />
        <Route path="/ai/:name" element={<DetailPage type="ai" />} />
        <Route path="/featured/:name" element={<DetailPage type="featured" />} />
      </Routes>
      <BottomNav />
      
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length >= 11) {
      await login(phone, password || '123456');
      onClose();
    }
  };

  return (
    <div className="login-modal" onClick={onClose}>
      <div className="login-content" onClick={e => e.stopPropagation()}>
        <h2 className="login-title">登录夸克</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            className="login-input"
            placeholder="请输入手机号"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={11}
          />
          <input
            type="password"
            className="login-input"
            placeholder="请输入密码（默认123456）"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="login-btn">
            登录 / 注册
          </button>
        </form>
        <div className="login-close" onClick={onClose}>取消</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
