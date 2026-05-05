import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageCenterAPI } from '../api';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await messageCenterAPI.getUnreadCount();
        if (response.data?.success) {
          setUnreadCount(response.data.data.count);
        }
      } catch (e) {
        console.error('获取未读数量失败:', e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/contacts', label: '联系人', icon: '👥' },
    { path: '/message-center', label: '消息中心', icon: '📬', badge: unreadCount },
    { path: '/video-messages', label: '视频留言', icon: '🎬' }
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logoSection}>
          <h1 style={styles.logo}>Weaver</h1>
          <div style={styles.status}>
            <span style={{ ...styles.dot, ...(isConnected ? styles.dotOnline : styles.dotOffline) }} />
            <span style={styles.statusText}>
              {isConnected ? '在线' : '连接中...'}
            </span>
          </div>
        </div>

        <div style={styles.navSection}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={styles.navItem}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {item.badge > 0 && (
                <span style={styles.badge}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" style={styles.avatarImg} />
              ) : (
                <span style={styles.avatarText}>
                  {user?.username?.[0] || user?.cid?.[0] || 'U'}
                </span>
              )}
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>
                {user?.username || user?.cid}
              </div>
              <div style={styles.userCid}>{user?.cid}</div>
            </div>
            <button
              style={styles.menuBtn}
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
          </div>

          {showMenu && (
            <div style={styles.dropdown}>
              <Link to="/profile" style={styles.dropdownItem}>
                个人设置
              </Link>
              <button style={styles.dropdownItem} onClick={handleLogout}>
                退出登录
              </button>
            </div>
          )}
        </div>
      </nav>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  sidebar: {
    width: '260px',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
  },
  logoSection: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  dotOnline: {
    background: '#4ade80'
  },
  dotOffline: {
    background: '#f87171'
  },
  statusText: {
    fontSize: '12px',
    opacity: 0.8
  },
  navSection: {
    flex: 1,
    padding: '16px 12px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    margin: '4px 0',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.2s',
    cursor: 'pointer',
    position: 'relative'
  },
  navIcon: {
    fontSize: '20px',
    marginRight: '12px'
  },
  navLabel: {
    fontSize: '15px',
    fontWeight: '500'
  },
  badge: {
    position: 'absolute',
    right: '16px',
    background: '#ef4444',
    color: 'white',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center'
  },
  userSection: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    position: 'relative'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px'
  },
  userCid: {
    fontSize: '11px',
    opacity: 0.7
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.8
  },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: '16px',
    right: '16px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  main: {
    flex: 1,
    overflow: 'auto'
  }
};

export default Layout;
