import { useState } from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  const { isAuthenticated } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header collapsed={collapsed} onToggleCollapsed={() => setCollapsed(!collapsed)} />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 lg:p-6 overflow-auto"
        >
          <div className="max-w-[1920px] mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
