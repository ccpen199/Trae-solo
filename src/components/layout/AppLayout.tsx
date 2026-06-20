import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <Header sidebarCollapsed={sidebarCollapsed} onMenuToggle={toggleSidebar} />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ease-out-expo',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        <div
          key={location.pathname}
          className="p-4 md:p-6 lg:p-8 animate-fade-in-up"
        >
          <Outlet />
        </div>
      </main>

      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export default AppLayout;
