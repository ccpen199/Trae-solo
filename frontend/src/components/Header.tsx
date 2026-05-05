import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useModalStore } from '@/store';

const Header: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { setShowLoginModal } = useModalStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    setShowUserMenu(false);
    navigate('/');
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  };

  const logoStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: '#ff385c',
    cursor: 'pointer',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  };

  const navItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const userButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 20,
    border: '1px solid #ddd',
    cursor: 'pointer',
    position: 'relative',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    minWidth: 180,
    overflow: 'hidden',
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          🏠 民宿预订
        </Link>

        <nav style={navStyle}>
          <Link to="/" style={{ ...navItemStyle, textDecoration: 'none', color: '#333' }}>
            发现
          </Link>
          
          {isAuthenticated ? (
            <Link to="/bookings" style={{ ...navItemStyle, textDecoration: 'none', color: '#333' }}>
              我的订单
            </Link>
          ) : null}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                style={userButtonStyle}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span style={{ fontSize: 18 }}>👤</span>
                <span style={{ color: '#333' }}>
                  {user?.nickname || user?.phone?.slice(-4)}
                </span>
              </button>

              {showUserMenu && (
                <div style={dropdownStyle}>
                  <Link
                    to="/profile"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      textDecoration: 'none',
                      color: '#333',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    个人中心
                  </Link>
                  <Link
                    to="/bookings"
                    style={{
                      ...dropdownItemStyle,
                      display: 'block',
                      textDecoration: 'none',
                      color: '#333',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    我的订单
                  </Link>
                  <div
                    style={{ ...dropdownItemStyle, color: '#ff4d4f' }}
                    onClick={handleLogout}
                  >
                    退出登录
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              style={{
                ...navItemStyle,
                backgroundColor: '#ff385c',
                color: '#fff',
                border: 'none',
                fontSize: 14,
              }}
              onClick={() => setShowLoginModal(true)}
            >
              登录 / 注册
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
