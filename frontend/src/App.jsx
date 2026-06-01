import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import RelationsPage from './pages/RelationsPage.jsx';
import RecommendationsPage from './pages/RecommendationsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RiskPage from './pages/RiskPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import api from './api/client.js';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('2');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId') || '2';
    localStorage.setItem('userId', savedUserId);
    setCurrentUserId(savedUserId);
    loadUsers(savedUserId);
  }, []);

  const loadUsers = async (selectedUserId) => {
    setLoading(true);
    try {
      const res = await api.get('/users/list?pageSize=100');
      setUsers(res.data.list || []);
      const userRes = await api.get(`/users/${selectedUserId}`);
      setCurrentUser(userRes.data);
    } catch (err) {
      console.error('加载用户失败:', err);
    }
    setLoading(false);
  };

  const handleUserChange = async (e) => {
    const userId = e.target.value;
    localStorage.setItem('userId', userId);
    setCurrentUserId(userId);
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setCurrentUser(res.data);
    } catch (err) {
      console.error('切换用户失败:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app">
        <main className="main">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            加载中...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>社交关系链</h2>
        <nav>
          <NavLink to="/" end>关系管理</NavLink>
          <NavLink to="/recommendations">推荐</NavLink>
          <NavLink to="/reports">举报</NavLink>
          <NavLink to="/risk">风控中心</NavLink>
          <NavLink to="/dashboard">运营看板</NavLink>
        </nav>
      </aside>
      <main className="main">
        <div className="header">
          <h1>社交关系链服务</h1>
          <div className="user-select">
            <span>当前用户：</span>
            <select 
              value={currentUser?.id || currentUserId} 
              onChange={handleUserChange}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nickname} (@{user.username})
                </option>
              ))}
            </select>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<RelationsPage key={currentUserId} currentUser={currentUser} />} />
          <Route path="/recommendations" element={<RecommendationsPage key={currentUserId} />} />
          <Route path="/reports" element={<ReportsPage key={currentUserId} />} />
          <Route path="/risk" element={<RiskPage key={currentUserId} />} />
          <Route path="/dashboard" element={<DashboardPage key={currentUserId} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
