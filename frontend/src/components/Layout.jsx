import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const navItems = [
    { path: '/', label: '推荐', icon: '🏠' },
    { path: '/live', label: '直播', icon: '📺' },
    { path: '/top', label: 'Top', icon: '🏆' },
    { path: '/follow', label: '关注', icon: '❤️' },
  ];

  const bottomNavItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/sleep', label: '睡购', icon: '😴' },
    { path: '/profile', label: '我的', icon: '👤' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
      setSearchKeyword('');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>🎧 ASMR-ers</Link>
        
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            inputMode="search"
            style={styles.searchInput}
            placeholder="搜索音频、创作者..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </form>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(location.pathname === item.path ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={styles.userArea}>
          {user ? (
            <div style={styles.userInfo}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                {user.nickname?.charAt(0) || '?'}
              </div>
              <span style={styles.userName}>{user.nickname}</span>
              <button onClick={logout} style={styles.logoutBtn}>退出</button>
            </div>
          ) : (
            <Link to="/login" style={styles.loginBtn}>登录</Link>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>

      <nav style={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.bottomNavItem,
              ...(location.pathname === item.path ? styles.bottomNavItemActive : {}),
            }}
          >
            <span style={styles.bottomNavIcon}>{item.icon}</span>
            <span style={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 40px',
    background: 'rgba(10, 10, 15, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    gap: 40,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #f472b6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  searchForm: {
    flex: 1,
    maxWidth: 400,
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  nav: {
    display: 'flex',
    gap: 32,
  },
  navLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 14,
    transition: 'color 0.2s',
  },
  navLinkActive: {
    color: '#fff',
    fontWeight: 600,
  },
  userArea: {
    marginLeft: 'auto',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
  },
  userName: {
    fontSize: 14,
  },
  logoutBtn: {
    padding: '6px 12px',
    background: 'none',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    color: '#9ca3af',
    fontSize: 12,
    cursor: 'pointer',
  },
  loginBtn: {
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    borderRadius: 20,
    color: '#fff',
    fontSize: 14,
    textDecoration: 'none',
  },
  main: {
    flex: 1,
    padding: '24px 40px 100px',
  },
  bottomNav: {
    display: 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(10, 10, 15, 0.95)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '8px 0',
    justifyContent: 'space-around',
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 12,
  },
  bottomNavItemActive: {
    color: '#8b5cf6',
  },
  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bottomNavLabel: {
    fontSize: 10,
  },
  '@media (max-width: 768px)': {
    header: {
      padding: '12px 16px',
      gap: 16,
    },
    nav: {
      display: 'none',
    },
    main: {
      padding: '16px 16px 80px',
    },
    bottomNav: {
      display: 'flex',
    },
  },
};

export default Layout;
