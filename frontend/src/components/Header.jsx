import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  const navLinks = [
    { path: '/home', label: '首页' },
    { path: '/inventory', label: '背包' },
    { path: '/recipes', label: '配方' },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/home" className="logo">
          🏠 休闲合成游戏
        </Link>

        <nav className="nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <div className="user-info">
              <div className="user-stats">
                <span className="stat">
                  💰 <span className="stat-value">{user.coins}</span>
                </span>
                <span className="stat">
                  ⭐ <span className="stat-value">Lv.{user.level}</span>
                </span>
              </div>
              <button className="btn btn-secondary" onClick={handleLogout}>
                退出
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
