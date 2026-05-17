import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    logout: state.logout
  }));

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/live', label: '直播', icon: '📺' },
    { path: '/mall', label: '会员购', icon: '🛒' },
    { path: '/game', label: '游戏中心', icon: '🎮' },
    { path: '/messages', label: '消息', icon: '💬' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        height: '64px',
        backgroundColor: 'white',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📺</span>
            <span>B站战略版</span>
          </Link>

          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: location.pathname === item.path ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
              <>
                <Link to="/my" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={user?.avatar || 'https://via.placeholder.com/40x40?text=User'}
                    alt="avatar"
                    className="avatar"
                  />
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                    {user?.nickname || '用户'}
                  </span>
                  {user?.vip_type > 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #fb7299, #ff9c6a)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}>大会员</span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" style={{ fontSize: '14px' }}>
                  登录
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '14px' }}>
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 0' }}>
        <Outlet />
      </main>

      <footer style={{
        backgroundColor: 'white',
        padding: '20px 0',
        borderTop: '1px solid var(--border-color)',
        marginTop: '40px'
      }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          <p>B站战略版 © 2024 | 视频社区 | 会员等级 | 直播 | 会员购 | 游戏中心</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
