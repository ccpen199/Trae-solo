import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            🏠 本地生活撮合
          </div>
          <nav className="nav-links">
            <Link to="/" className="nav-link">首页</Link>
            <Link to="/category/all" className="nav-link">全部信息</Link>
            {user ? (
              <>
                <Link to="/create" className="nav-link nav-link-highlight">发布信息</Link>
                <Link to="/transactions" className="nav-link">担保交易</Link>
                <Link to="/profile" className="nav-link">个人中心</Link>
                <Link to="/admin" className="nav-link">运营后台</Link>
                <span className="nav-user">👤 {user.nickname}</span>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">登录</Link>
                <Link to="/register" className="btn btn-outline btn-sm">免费注册</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
