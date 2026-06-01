import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

function Header() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user?.user_type === 'admin';
  const isMerchant = user?.user_type === 'b';

  const goPublish = () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/publish' } } });
    } else {
      navigate('/publish');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">🏠 本地信息撮合平台</Link>

          <nav>
            <ul className="nav-menu">
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link></li>
              <li><Link to="/map" className={location.pathname === '/map' ? 'active' : ''}>地图浏览</Link></li>
              <li><span style={{ cursor: 'pointer' }} className={location.pathname === '/publish' ? 'active' : ''} onClick={goPublish}>发布</span></li>
              {isAdmin && <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>管理后台</Link></li>}
              {isMerchant && <li><Link to="/merchant" className={location.pathname === '/merchant' ? 'active' : ''}>商家中心</Link></li>}
            </ul>
          </nav>

          <div className="user-actions">
            {user ? (
              <>
                <Link to="/profile"><button className="btn btn-outline" style={{ fontSize: 13 }}>{user.nickname || user.phone}</button></Link>
                <button className="btn btn-outline" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <Link to="/auth" state={{ from: { pathname: location.pathname } }}>
                <button className="btn btn-primary">登录/注册</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
