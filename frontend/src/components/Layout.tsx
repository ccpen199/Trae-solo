import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Home,
  Building2,
  FileText,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';
import type { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = (role: UserRole) => {
    const baseItems = [
      { path: '/', label: '仪表盘', icon: Home },
    ];

    if (role === UserRole.LANDLORD || role === UserRole.ADMIN) {
      return [
        ...baseItems,
        { path: '/properties', label: '房源管理', icon: Building2 },
        { path: '/orders', label: '订单管理', icon: FileText },
        { path: '/cleaning', label: '保洁管理', icon: Sparkles },
      ];
    }

    if (role === UserRole.CLEANER) {
      return [
        ...baseItems,
        { path: '/cleaning', label: '保洁任务', icon: Sparkles },
      ];
    }

    if (role === UserRole.GUEST) {
      return [
        ...baseItems,
        { path: '/orders', label: '我的订单', icon: FileText },
      ];
    }

    return baseItems;
  };

  const navItems = user ? getNavItems(user.role) : [];

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      [UserRole.LANDLORD]: '房东',
      [UserRole.GUEST]: '住客',
      [UserRole.CLEANER]: '保洁人员',
      [UserRole.CHANNEL_PLATFORM]: '渠道平台',
      [UserRole.ADMIN]: '管理员',
    };
    return labels[role] || role;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '240px',
          backgroundColor: 'white',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--gray-100)',
          }}
        >
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--primary-color)',
            }}
          >
            民宿预订管理系统
          </h1>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                color: 'var(--gray-600)',
                textDecoration: 'none',
                marginBottom: '0.25rem',
                transition: 'all 0.2s',
              }}
              className="nav-link"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                e.currentTarget.style.color = 'var(--gray-800)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gray-600)';
              }}
            >
              <item.icon size={20} />
              <span style={{ fontWeight: '500' }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--gray-100)',
          }}
        >
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)',
                  }}
                >
                  {getRoleLabel(user.role)}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: '100%' }}
          >
            <LogOut size={18} style={{ marginRight: '0.5rem' }} />
            退出登录
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: '2rem',
          backgroundColor: 'var(--gray-50)',
          overflow: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
