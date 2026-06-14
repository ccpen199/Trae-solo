import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'jobseeker': return '/jobseeker';
      case 'employer': return '/employer';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">蓝领就业平台</Link>
        
        <nav className="nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
          <Link to="/jobs" className={location.pathname === '/jobs' ? 'active' : ''}>搜索筛选岗位</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>管理后台</Link>
          )}
          {user && <Link to="/messages" className={location.pathname === '/messages' ? 'active' : ''}>消息</Link>}
        </nav>

        <div className="nav">
          {user ? (
            <>
              <Link to={getDashboardLink()}>个人中心</Link>
              <a href="#" onClick={handleLogout} style={{ cursor: 'pointer' }}>退出</a>
            </>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register" className="btn btn-primary btn-sm">注册</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
