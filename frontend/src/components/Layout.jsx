import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitial = () => {
    if (user?.nickname) return user.nickname.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.phone) return user.phone.charAt(0);
    return '?';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/schedule', label: '预定会议' },
    { path: '/join', label: '加入会议' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className="header-logo">
            <span>📹</span>
            <span>云会议</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            className="header-user"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="avatar">{getInitial()}</div>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>
              {user?.nickname || user?.username || '用户'}
            </span>
            <span style={{ fontSize: '12px' }}>▼</span>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
              >
                👤 个人中心
              </button>
              <button
                className="dropdown-item danger"
                onClick={handleLogout}
              >
                🚪 退出登录
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main">{children}</main>
    </div>
  );
};

export default Layout;
