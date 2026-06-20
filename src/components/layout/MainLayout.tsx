import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { UserRole } from './Sidebar';

const roleMap: Record<string, UserRole> = {
  SUPER_ADMIN: 'admin',
  COMMUNITY_ADMIN: 'admin',
  PROPERTY_STAFF: 'property',
  FINANCE_STAFF: 'property',
  SECURITY_STAFF: 'maintenance',
  RESIDENT: 'resident',
};

export function MainLayout() {
  const { user, isAuthenticated } = useUserStore();
  const role: UserRole = user ? roleMap[user.role] || 'admin' : 'admin';
  const collapsed = false;

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header collapsed={collapsed} onToggleCollapsed={() => {}} />
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
