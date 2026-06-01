import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi, commonApi } from '../services/api';

const Layout = ({ user, setUser, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await commonApi.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      console.error('加载通知失败', err);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('登出失败', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { path: '/', label: '首页', roles: ['admin', 'teacher', 'parent', 'student'] },
    { path: '/courses', label: '课程管理', roles: ['admin', 'teacher'] },
    { path: '/courses', label: '课程列表', roles: ['parent', 'student'] },
    { path: '/enrollments', label: '报名记录', roles: ['admin', 'teacher', 'parent', 'student'] },
    { path: '/attendance', label: '签到管理', roles: ['admin', 'teacher'] },
    { path: '/attendance', label: '我的签到', roles: ['parent', 'student'] },
    { path: '/schedule', label: '课表', roles: ['parent', 'student'] },
    { path: '/orders', label: '订单管理', roles: ['admin', 'parent', 'student'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h1>课后服务选课系统</h1>
          <nav className="nav">
            {filteredNavItems.map((item, index) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <Link key={index} to={item.path} className={isActive ? 'active' : ''}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="user-info">
          <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
            <span>🔔</span>
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>暂无通知</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.read ? '' : 'unread'}`}
                      onClick={() => {
                        if (!n.read) {
                          commonApi.markNotificationRead(n.id).then(() => loadNotifications());
                        }
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{n.content}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{n.created_at}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <span>欢迎，{user?.name}</span>
          <span className="badge badge-primary">
            {user?.role === 'admin' ? '管理员' : user?.role === 'teacher' ? '教师' : user?.role === 'parent' ? '家长' : '学生'}
          </span>
          <button className="btn" onClick={handleLogout}>退出</button>
        </div>
      </header>
      <main className="container">
        {children}
      </main>
    </div>
  );
};

export default Layout;
