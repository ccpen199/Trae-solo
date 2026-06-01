import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: '系统管理员', bg: '#d1fae5', color: '#065f46' },
  platform: { label: '平台管理员', bg: '#dbeafe', color: '#1e40af' },
  ops: { label: '运维管理员', bg: '#fed7aa', color: '#9a3412' },
  user: { label: '普通用户', bg: '#f3f4f6', color: '#6b7280' },
};

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: '📊', label: '仪表盘', roles: ['admin', 'platform', 'ops', 'user', 'viewer'] },
  { to: '/devices', icon: '📱', label: '设备管理', roles: ['admin', 'platform', 'ops', 'user', 'viewer'] },
  { to: '/scenes', icon: '🎬', label: '场景自动化', roles: ['admin', 'platform', 'ops', 'user'] },
  { to: '/permissions', icon: '🔐', label: '权限管理', roles: ['admin', 'platform', 'ops', 'user'] },
  { to: '/admin', icon: '⚙️', label: '管理后台', roles: ['admin', 'platform', 'ops'] },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'user';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.user;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return '仪表盘';
      case '/devices': return '设备管理';
      case '/scenes': return '场景自动化';
      case '/permissions': return '权限管理';
      case '/admin': return '管理后台';
      default: return '智能家居';
    }
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🏠 SmartHome</div>
        </div>
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="sidebar-link">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>
              {user?.username || '未知用户'}
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '12px',
              background: badge.bg,
              color: badge.color,
            }}>
              {badge.label}
            </span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">{getPageTitle()}</h1>
          <div className="user-info">
            <span style={{ fontSize: '14px', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.username}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '12px',
                background: badge.bg,
                color: badge.color,
              }}>
                {badge.label}
              </span>
            </span>
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
