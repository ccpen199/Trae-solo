import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/jobs', label: '找工作', icon: '💼' },
    { path: '/resumes', label: '找人才', icon: '👥' },
    { path: '/live', label: '直播招聘', icon: '📺' },
    { path: '/communities', label: '职业社群', icon: '🏘️' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          <Link to="/" style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            JobMatch
          </Link>

          <nav style={{ display: 'flex', gap: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  color: location.pathname === item.path ? 'var(--primary-color)' : 'var(--text-secondary)',
                  backgroundColor: location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <Link to="/chat" style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-secondary)',
                }}>
                  <span>💬</span> 消息
                </Link>

                {user.role === 'jobseeker' && (
                  <Link to="/my/resumes" className="btn btn-sm btn-outline">
                    我的简历
                  </Link>
                )}
                {user.role === 'hr' && (
                  <Link to="/my/jobs" className="btn btn-sm btn-outline">
                    职位管理
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn btn-sm btn-outline">
                    管理后台
                  </Link>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 20,
                  backgroundColor: 'var(--bg-tertiary)',
                }}>
                  <div className="avatar avatar-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{user.username}</span>
                  <button
                    onClick={handleLogout}
                    style={{ fontSize: 12, color: 'var(--text-muted)' }}
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline">登录</Link>
                <Link to="/register" className="btn btn-sm btn-primary">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        marginTop: 'auto',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>⚡ JobMatch</span>
            <span style={{ margin: '0 8px' }}>|</span>
            职场即时匹配平台
          </div>
          <div>
            © 2024 JobMatch. 让人才与机会秒连
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
