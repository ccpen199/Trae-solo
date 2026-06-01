import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-logo">📹 云视频会议</div>
          <div className="nav-links">
            <NavLink to="/" className="nav-link" end>
              首页
            </NavLink>
            <NavLink to="/history" className="nav-link">
              历史会议
            </NavLink>
            <NavLink to="/profile" className="nav-link">
              个人中心
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="nav-link">
                管理后台
              </NavLink>
            )}
          </div>
          <div className="nav-user">
            <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: '14px' }}>{user?.username}</span>
            <span className={`badge ${user?.plan === 'pro' ? 'badge-warning' : 'badge-primary'}`}>
              {user?.plan === 'pro' ? '专业版' : '免费版'}
            </span>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
};

export default Layout;
