import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NAV_ITEMS } from '@/utils/constants';
import { useAuthStore } from '@/store/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const pageTitle = useMemo(() => {
    const findTitle = (items: typeof NAV_ITEMS): string | null => {
      for (const item of items) {
        if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
          return item.label;
        }
        if (item.children) {
          const childTitle = findTitle(item.children);
          if (childTitle) return childTitle;
        }
      }
      return null;
    };

    const filteredItems = NAV_ITEMS.filter(
      (item) => user && item.roles.includes(user.role)
    );

    return findTitle(filteredItems) || '二手车交易平台';
  }, [location.pathname, user]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
