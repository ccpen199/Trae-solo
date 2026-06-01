import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/meetings', label: '会议管理', icon: '📅' },
    { path: '/action-items', label: '行动项列表', icon: '✅' },
    { path: '/workbench', label: '问题工作台', icon: '⚠️' },
    { path: '/audit-logs', label: '审计日志', icon: '📜', roles: ['admin', 'auditor'] }
  ];

  const isVisible = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.sidebar, width: sidebarOpen ? 220 : 60 }}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🤖</span>
          {sidebarOpen && <span style={styles.logoText}>AI会议跟踪</span>}
        </div>
        <nav style={styles.nav}>
          {menuItems.filter(isVisible).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                backgroundColor: location.pathname === item.path ? '#e8f4fd' : 'transparent',
                color: location.pathname === item.path ? '#1890ff' : '#333'
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
      <div style={styles.main}>
        <header style={styles.header}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleBtn}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div style={styles.headerRight}>
            <span style={styles.userInfo}>
              👤 {user?.name} ({user?.role === 'admin' ? '管理员' : user?.role === 'auditor' ? '审核员' : '用户'})
            </span>
            <button onClick={logout} style={styles.logoutBtn}>
              退出
            </button>
          </div>
        </header>
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' },
  sidebar: {
    backgroundColor: '#fff',
    borderRight: '1px solid #e8e8e8',
    transition: 'width 0.3s',
    overflow: 'hidden'
  },
  logo: { display: 'flex', alignItems: 'center', padding: 20, gap: 10, borderBottom: '1px solid #e8e8e8' },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nav: { padding: '10px 0' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    textDecoration: 'none',
    gap: 12,
    transition: 'all 0.2s'
  },
  navIcon: { fontSize: 18 },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e8e8e8'
  },
  toggleBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#666'
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 20 },
  userInfo: { fontSize: 14, color: '#666' },
  logoutBtn: {
    padding: '6px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 4,
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 14
  },
  content: { flex: 1, padding: 20, overflow: 'auto' }
};
