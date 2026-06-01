import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Resources from './pages/Resources.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Materials from './pages/Materials.jsx';
import RouteManagement from './pages/RouteManagement.jsx';
import { notificationsAPI } from './api/index.js';

function App() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll(false);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    await notificationsAPI.markRead(notification.id);
    fetchNotifications();
    if (notification.route_id) {
      navigate(`/routes/${notification.route_id}`);
    }
    setShowNotifications(false);
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 旅游资源管理系统</h1>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>首页</NavLink>
          <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''}>资源管理</NavLink>
          <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'active' : ''}>供应商</NavLink>
          <NavLink to="/materials" className={({ isActive }) => isActive ? 'active' : ''}>素材库</NavLink>
          <NavLink to="/routes" className={({ isActive }) => isActive ? 'active' : ''}>线路管理</NavLink>
          <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
            🔔
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            {showNotifications && (
              <div className="notification-panel">
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>通知中心</strong>
                  {unreadCount > 0 && (
                    <button className="btn btn-small btn-secondary" onClick={markAllRead}>全部已读</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="empty-state">暂无通知</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div 
                      key={n.id} 
                      className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{n.type === 'resource_closed' ? '⚠️ 资源停业' : n.type === 'price_change' ? '💰 价格变更' : n.type === 'supplier_change' ? '🏢 供应商变更' : '📢 通知'}</div>
                      <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>{n.message}</div>
                      <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem' }}>{n.created_at}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
      
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/routes" element={<RouteManagement />} />
          <Route path="/routes/:id" element={<RouteManagement />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
