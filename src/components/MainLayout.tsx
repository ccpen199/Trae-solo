import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  const { sidebarCollapsed, setCurrentPath } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname, setCurrentPath]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
