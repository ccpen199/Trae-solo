import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { authAPI } from '../utils/api';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '0 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '60px'
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none'
  },
  nav: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  navLink: {
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    cursor: 'pointer'
  },
  navLinkActive: {
    background: 'rgba(255,255,255,0.2)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  dropdown: {
    position: 'relative'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: '0',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '8px 0',
    minWidth: '160px',
    zIndex: 1000,
    marginTop: '8px'
  },
  dropdownItem: {
    padding: '10px 16px',
    color: '#333',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '20px'
  },
  footer: {
    background: '#333',
    color: '#999',
    padding: '20px',
    textAlign: 'center',
    fontSize: '14px'
  },
  btn: {
    padding: '8px 20px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  btnPrimary: {
    background: 'white',
    color: '#667eea'
  },
  btnOutline: {
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.5)'
  }
};

function Layout() {
  const { user, isAuthenticated, logout: storeLogout, isAdmin, isModerator } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    storeLogout();
    navigate('/');
    setShowDropdown(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? styles.navLinkActive : {};
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link to="/" style={styles.logo}>🏛️ 论坛</Link>
          
          <nav style={styles.nav}>
            <Link to="/" style={{ ...styles.navLink, ...isActive('/') }}>首页</Link>
            
            {isAuthenticated && (
              <Link to="/topic/create" style={styles.btn}>
                <span style={{ marginRight: '5px' }}>+</span> 发帖
              </Link>
            )}

            {isAuthenticated ? (
              <div style={styles.dropdown}>
                <div 
                  style={{ ...styles.userSection, cursor: 'pointer' }}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div style={styles.avatar}>
                    {user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ color: 'white' }}>{user?.nickname || user?.username}</span>
                  <span style={{ fontSize: '12px' }}>▼</span>
                </div>
                
                {showDropdown && (
                  <div style={styles.dropdownMenu}>
                    <Link 
                      to="/profile" 
                      style={styles.dropdownItem}
                      onClick={() => setShowDropdown(false)}
                    >
                      个人中心
                    </Link>
                    {(isAdmin() || isModerator()) && (
                      <Link 
                        to="/admin" 
                        style={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        管理后台
                      </Link>
                    )}
                    <div style={styles.dropdownItem} onClick={handleLogout}>
                      退出登录
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={{ ...styles.btn, ...styles.btnOutline }}>登录</Link>
                <Link to="/register" style={{ ...styles.btn, ...styles.btnPrimary }}>注册</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>

      <footer style={styles.footer}>
        <p>© 2024 论坛系统 | 端口: 前端 22175, 后端 12175</p>
      </footer>
    </div>
  );
}

export default Layout;
