import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GameList from './pages/GameList.jsx';
import GameDetail from './pages/GameDetail.jsx';
import CreateGame from './pages/CreateGame.jsx';
import VenueList from './pages/VenueList.jsx';
import MyGames from './pages/MyGames.jsx';
import Exceptions from './pages/admin/Exceptions.jsx';
import OperationLogs from './pages/admin/OperationLogs.jsx';
import Reports from './pages/admin/Reports.jsx';
import api from './utils/api.js';

const canCreateGame = (role) => {
  return ['user', 'organizer', 'venue_manager'].includes(role);
};

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '20px' }}>权限不足</h2>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          您的角色是 <strong>{getRoleName(user.role)}</strong>，没有权限使用此功能。
        </p>
        <p style={{ color: '#718096' }}>
          创建球局是普通用户、组织者、场馆经理的专属功能。
        </p>
      </div>
    );
  }
  return children;
};

const getRoleName = (role) => {
  const roles = {
    admin: '系统管理员',
    operator: '运营人员',
    customer_service: '客服',
    venue_manager: '场馆经理',
    organizer: '组织者',
    user: '普通用户'
  };
  return roles[role] || role;
};

const getNavItems = (role) => {
  const commonItems = [
    { path: '/dashboard', name: '工作台', icon: '📊' },
    { path: '/games', name: '球局广场', icon: '⚽' },
    { path: '/venues', name: '场馆列表', icon: '🏟️' },
    { path: '/my-games', name: '我的球局', icon: '📅' }
  ];
  
  const adminItems = [
    { path: '/exceptions', name: '异常队列', icon: '⚠️' },
    { path: '/logs', name: '操作日志', icon: '📝' },
    { path: '/reports', name: '运营报表', icon: '📈' }
  ];
  
  if (['admin', 'operator', 'customer_service'].includes(role)) {
    return [...commonItems, ...adminItems];
  }
  return commonItems;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Login onLogin={(userData) => setUser(userData)} />;
  }

  const navItems = getNavItems(user.role);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>🎾 约球平台</h2>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.path}>
              <a 
                href={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                {item.icon} {item.name}
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <div className="main-content">
        <div className="header">
          <h1>{navItems.find(i => i.path === location.pathname)?.name || '约球平台'}</h1>
          <div className="user-info">
            <span>
              <span className="role-badge">{getRoleName(user.role)}</span>
              {user.nickname} (Lv.{user.level})
            </span>
            <button onClick={handleLogout}>退出</button>
          </div>
        </div>
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/games" element={<GameList user={user} canCreate={canCreateGame(user.role)} />} />
          <Route path="/games/:id" element={<GameDetail user={user} />} />
          <Route path="/create-game" element={
            <ProtectedRoute user={user} allowedRoles={['user', 'organizer', 'venue_manager']}>
              <CreateGame user={user} />
            </ProtectedRoute>
          } />
          <Route path="/venues" element={<VenueList user={user} canCreate={canCreateGame(user.role)} />} />
          <Route path="/my-games" element={<MyGames user={user} />} />
          <Route path="/exceptions" element={<Exceptions user={user} />} />
          <Route path="/logs" element={<OperationLogs user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
