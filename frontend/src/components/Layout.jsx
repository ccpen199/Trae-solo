import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

function Layout() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1890ff' }}>优惠券平台</Link>
          </div>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
            <Link to="/shops" className={location.pathname.startsWith('/shops') ? 'active' : ''}>店铺</Link>
            <Link to="/coupons" className={location.pathname.startsWith('/coupons') ? 'active' : ''}>优惠券</Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>管理</Link>
                <span style={{ padding: '8px 16px' }}>{user?.username}</span>
                <button className="btn" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <Link to="/login">登录</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
