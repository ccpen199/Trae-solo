import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const Layout = ({ children, title, showAdminMenu = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '首页', icon: '🏠' },
    { path: '/payment', label: '扫码支付', icon: '💳' },
    { path: '/transfer', label: '转账', icon: '↔️' },
    { path: '/transactions', label: '交易记录', icon: '📋' },
  ];

  const adminNavItems = [
    { path: '/admin', label: '管理仪表盘', icon: '📊' },
    { path: '/admin/risk', label: '风险监控', icon: '⚠️' },
    { path: '/admin/reconciliation', label: '财务对账', icon: '📑' },
    { path: '/admin/audit', label: '审计溯源', icon: '🔍' },
  ];

  const currentNavItems = showAdminMenu ? adminNavItems : navItems;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to={showAdminMenu ? '/admin' : '/dashboard'} style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>💰</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>数字钱包</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>👤 {user?.realName || user?.username}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{
          width: '200px',
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          padding: '20px 0'
        }}>
          {currentNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#667eea' : '#333',
                background: location.pathname === item.path ? '#f0f2ff' : 'transparent',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                borderLeft: location.pathname === item.path ? '3px solid #667eea' : '3px solid transparent'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          
          {!showAdminMenu && (
            <>
              <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>管理入口</div>
                <Link
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 20px',
                    textDecoration: 'none',
                    color: '#667eea',
                    fontSize: '14px'
                  }}
                >
                  <span>⚙️</span>
                  <span>管理后台</span>
                </Link>
              </div>
            </>
          )}
          
          {showAdminMenu && (
            <>
              <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>返回用户端</div>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 20px',
                    textDecoration: 'none',
                    color: '#667eea',
                    fontSize: '14px'
                  }}
                >
                  <span>🏠</span>
                  <span>用户首页</span>
                </Link>
              </div>
            </>
          )}
        </nav>

        <main style={{ flex: 1, padding: '24px', background: '#f5f7fa' }}>
          {title && (
            <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#333' }}>{title}</h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
