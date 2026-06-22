import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useUserStore } from '@/store/userStore';

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const location = useLocation();
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const t = useUserStore.getState().token;
    const u = useUserStore.getState().user;
    if (t && u) {
      setHydrated(true);
    } else {
      const timeout = setTimeout(() => setHydrated(true), 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-ivory">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
          <p className="text-neutral-ink-500 text-sm">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-ivory">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto scrollbar-thin p-6 bg-neutral-ivory">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
