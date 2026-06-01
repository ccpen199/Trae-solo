import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from './utils/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import ConfigVersions from './pages/ConfigVersions';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import ChangeOrders from './pages/ChangeOrders';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrent().then(res => {
        setUser(res.data.user);
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      });
    }
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { key: '/dashboard', label: '工作台', icon: '📊' },
    { key: '/applications', label: '应用管理', icon: '📦' },
    { key: '/config', label: '配置管理', icon: '⚙️' },
    { key: '/tasks', label: '执行任务', icon: '📋' },
    { key: '/change-orders', label: '变更单', icon: '📝' },
    { key: '/alerts', label: '告警中心', icon: '🔔' },
    { key: '/audit', label: '审计日志', icon: '📜' },
    { key: '/users', label: '用户管理', icon: '👥' }
  ];

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🚀 配置灰度发布</h1>
        </div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <div
              key={item.key}
              className={`menu-item ${location.pathname.startsWith(item.key) ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">
        <div className="header">
          <h2>{menuItems.find(m => location.pathname.startsWith(m.key))?.label || '工作台'}</h2>
          {user && (
            <div className="user-info">
              <span className={`role-badge role-${user.role}`}>{getRoleLabel(user.role)}</span>
              <span>{user.name}</span>
              <button className="btn btn-default btn-sm" onClick={handleLogout}>退出</button>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

const getRoleLabel = (role) => {
  const labels = {
    admin: '系统管理员',
    developer: '开发者',
    operator: '运维',
    owner: '应用负责人',
    security: '安全管理员'
  };
  return labels[role] || role;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><Layout><Applications /></Layout></PrivateRoute>} />
      <Route path="/applications/:id" element={<PrivateRoute><Layout><ApplicationDetail /></Layout></PrivateRoute>} />
      <Route path="/config" element={<PrivateRoute><Layout><ConfigVersions /></Layout></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><Layout><Tasks /></Layout></PrivateRoute>} />
      <Route path="/tasks/:id" element={<PrivateRoute><Layout><TaskDetail /></Layout></PrivateRoute>} />
      <Route path="/change-orders" element={<PrivateRoute><Layout><ChangeOrders /></Layout></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Layout><Alerts /></Layout></PrivateRoute>} />
      <Route path="/audit" element={<PrivateRoute><Layout><AuditLogs /></Layout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
    </Routes>
  );
}

export default App;
