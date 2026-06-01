import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Packages from './pages/Packages.jsx';
import Appointments from './pages/Appointments.jsx';
import Checkup from './pages/Checkup.jsx';
import Reports from './pages/Reports.jsx';
import { authAPI } from './api.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Sidebar user={user} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/packages" element={<Packages user={user} />} />
            <Route path="/appointments" element={<Appointments user={user} />} />
            <Route path="/checkup" element={<Checkup user={user} />} />
            <Route path="/reports" element={<Reports user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <h1>🏥 体检中心预约报告系统</h1>
      <div className="user-info">
        <span className="text-sm">
          {user.name} <span className="badge badge-info">{getRoleName(user.role)}</span>
        </span>
        <button onClick={onLogout}>退出</button>
      </div>
    </header>
  );
}

function Sidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: '首页仪表板', roles: ['admin', 'reception', 'doctor', 'lab', 'customer'] },
    { path: '/packages', label: '套餐管理', roles: ['admin', 'reception'] },
    { path: '/appointments', label: '预约管理', roles: ['admin', 'reception', 'customer'] },
    { path: '/checkup', label: '体检执行', roles: ['admin', 'doctor', 'lab', 'reception'] },
    { path: '/reports', label: '报告管理', roles: ['admin', 'doctor', 'customer'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="sidebar">
      <nav>
        {filteredItems.map(item => (
          <a
            key={item.path}
            className={location.pathname === item.path ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); navigate(item.path); }}
            href={item.path}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function getRoleName(role) {
  const names = {
    admin: '管理员',
    reception: '前台',
    doctor: '医生',
    lab: '检验科',
    customer: '客户'
  };
  return names[role] || role;
}

export default App;
