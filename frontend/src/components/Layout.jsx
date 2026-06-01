import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Layout({ children }) {
  const user = useAuthStore((state) => state.user);
  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">本地生活聚合平台</NavLink>
        <ul className="nav-links">
          <li><NavLink to="/" end>首页</NavLink></li>
          <li><NavLink to="/jobs">招聘</NavLink></li>
          <li><NavLink to="/properties">房产</NavLink></li>
          <li><NavLink to="/cars">二手车</NavLink></li>
          <li><NavLink to="/news">资讯</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/publish">发布</NavLink></li>
              <li><NavLink to="/profile">个人中心</NavLink></li>
              <li><a onClick={handleLogout} style={{ cursor: 'pointer' }}>退出</a></li>
            </>
          ) : admin ? (
            <>
              <li><NavLink to="/admin">管理后台</NavLink></li>
              <li><a onClick={handleLogout} style={{ cursor: 'pointer' }}>退出</a></li>
            </>
          ) : (
            <>
              <li><NavLink to="/login">登录</NavLink></li>
              <li><NavLink to="/register">注册</NavLink></li>
            </>
          )}
        </ul>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  );
}

export default Layout;
