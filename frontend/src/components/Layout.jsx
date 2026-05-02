import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#2c3e50',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #34495e',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  sidebarSubtitle: {
    fontSize: '12px',
    color: '#95a5a6',
    marginTop: '4px',
  },
  navList: {
    listStyle: 'none',
    padding: '16px 0',
    margin: 0,
    flex: 1,
  },
  navItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: 'white',
  },
  navItemActive: {
    backgroundColor: '#3498db',
  },
  navItemHover: {
    backgroundColor: '#34495e',
  },
  badge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
    marginLeft: 'auto',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #34495e',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  userRole: {
    fontSize: '12px',
    color: '#95a5a6',
  },
  logoutButton: {
    width: '100%',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #7f8c8d',
    color: '#95a5a6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    backgroundColor: 'white',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: '24px',
  },
};

const Layout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await messageAPI.getUnread();
        setUnreadCount(response.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch unread messages:', error);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: '📊', roles: ['developer', 'reviewer', 'devops', 'admin'] },
    { path: '/repositories', label: '仓库管理', icon: '📁', roles: ['developer', 'reviewer', 'devops', 'admin'] },
    { path: '/merge-requests', label: '合并请求', icon: '🔀', roles: ['developer', 'reviewer', 'devops', 'admin'] },
    { path: '/pipelines', label: '构建部署', icon: '🚀', roles: ['devops', 'admin'] },
    { path: '/messages', label: '消息中心', icon: '💬', roles: ['developer', 'reviewer', 'devops', 'admin'], badge: unreadCount },
    { path: '/audit', label: '审计日志', icon: '📋', roles: ['admin'] },
  ];

  const getRoleLabel = (role) => {
    const labels = {
      admin: '管理员',
      developer: '开发者',
      reviewer: '审查者',
      devops: '运维',
    };
    return labels[role] || role;
  };

  const getPageTitle = () => {
    const titles = {
      '/dashboard': '仪表盘',
      '/repositories': '仓库管理',
      '/merge-requests': '合并请求',
      '/pipelines': '构建部署',
      '/messages': '消息中心',
      '/audit': '审计日志',
    };
    for (const [path, title] of Object.entries(titles)) {
      if (location.pathname.startsWith(path)) {
        return title;
      }
    }
    return '';
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.sidebarTitle}>代码托管平台</h1>
          <p style={styles.sidebarSubtitle}>协作管理系统</p>
        </div>
        <ul style={styles.navList}>
          {navItems
            .filter((item) => hasPermission(item.roles))
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(location.pathname.startsWith(item.path) ? styles.navItemActive : {}),
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={styles.badge}>{item.badge}</span>
                )}
              </Link>
            ))}
        </ul>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user?.username}</div>
              <div style={styles.userRole}>{getRoleLabel(user?.role)}</div>
            </div>
          </div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>{getPageTitle()}</div>
        </div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
