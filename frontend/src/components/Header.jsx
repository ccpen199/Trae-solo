import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">新商业资讯</Link>
        
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
            </li>
            <li>
              <Link to="#" onClick={(e) => { e.preventDefault(); if (!isAuthenticated) { navigate('/login'); }}}>我的收藏</Link>
            </li>
            <li>
              <Link to="#" onClick={(e) => { e.preventDefault(); if (!isAuthenticated) { navigate('/login'); }}}>消息中心</Link>
            </li>
          </ul>
        </nav>

        <div className="user-actions">
          {isAuthenticated ? (
            <div className="user-info">
              <div className="avatar">
                {user?.nickname?.charAt(0) || '用'}
              </div>
              <span style={{ fontSize: '14px', color: '#666' }}>{user?.nickname}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                退出
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">登录</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
