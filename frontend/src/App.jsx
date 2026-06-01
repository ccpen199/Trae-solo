import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import RoomsPage from './pages/Rooms.jsx';
import RoomDetailPage from './pages/RoomDetail.jsx';
import ReviewQueuePage from './pages/ReviewQueue.jsx';
import DashboardPage from './pages/Dashboard.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = '1';
      localStorage.setItem('userId', uid);
    }
    api.getMe().then(r => setCurrentUser(r.user)).catch(() => {});
    api.getUsers({ pageSize: 50 }).then(r => setUsers(r.users)).catch(() => {});
  }, []);

  const handleSwitchUser = (id) => {
    api.switchUser(id).then(r => {
      setCurrentUser(r.user);
      navigate('/rooms');
    }).catch(() => {});
  };

  const navStyle = ({ isActive }) => ({
    padding: '10px 18px',
    borderRadius: '8px',
    background: isActive ? '#5b5fc7' : 'transparent',
    color: isActive ? '#fff' : '#b0b0c0',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s'
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #2a2a4e',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>🎙️ 语音房管理系统</span>
          <nav style={{ display: 'flex', gap: '8px' }}>
            <NavLink to="/rooms" style={navStyle}>房间列表</NavLink>
            <NavLink to="/reviews" style={navStyle}>审核队列</NavLink>
            <NavLink to="/dashboard" style={navStyle}>运营看板</NavLink>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser && (
            <span style={{ color: '#b0b0c0', fontSize: '14px' }}>
              {currentUser.nickname} <span style={{
                background: currentUser.role === 'admin' ? '#e74c3c' :
                  currentUser.role === 'host' ? '#3498db' :
                  currentUser.role === 'reviewer' ? '#f39c12' :
                  currentUser.role === 'operator' ? '#9b59b6' : '#2ecc71',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                marginLeft: '6px'
              }}>{currentUser.role}</span>
            </span>
          )}
          <select
            value={currentUser?.id || ''}
            onChange={(e) => e.target.value && handleSwitchUser(e.target.value)}
            style={{
              background: '#2a2a4e',
              color: '#e0e0e0',
              border: '1px solid #3a3a5e',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px'
            }}
          >
            <option value="">切换身份</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.nickname} ({u.role})</option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px', background: '#0f0f1a' }}>
        <Routes>
          <Route path="/" element={<RoomsPage currentUser={currentUser} />} />
          <Route path="/rooms" element={<RoomsPage currentUser={currentUser} />} />
          <Route path="/rooms/:id" element={<RoomDetailPage currentUser={currentUser} />} />
          <Route path="/reviews" element={<ReviewQueuePage currentUser={currentUser} />} />
          <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} />} />
        </Routes>
      </main>
    </div>
  );
}
