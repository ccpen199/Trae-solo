import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Gavel,
  Briefcase,
  ShieldCheck,
  FileWarning,
  LayoutDashboard,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';

interface SidebarItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const lawyerMenuItems: SidebarItem[] = [
  { to: '/lawyer/hall', label: '抢单大厅', icon: Gavel },
  { to: '/lawyer/cases', label: '我的案件', icon: Briefcase },
];

const adminMenuItems: SidebarItem[] = [
  { to: '/admin/verify', label: '资质核验', icon: ShieldCheck },
  { to: '/admin/disputes', label: '纠纷处理', icon: FileWarning },
  { to: '/admin/monitor', label: '监控看板', icon: LayoutDashboard },
];

const roleTitle: Record<UserRole, string> = {
  user: '用户端',
  lawyer: '律师工作台',
  admin: '管理后台',
};

export function Sidebar() {
  const location = useLocation();
  const { role } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (role === 'user') return null;

  const menuItems = role === 'lawyer' ? lawyerMenuItems : adminMenuItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-primary-100 flex flex-col shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-primary-100">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="title"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Scale className="h-4 w-4 text-accent-gold" />
              <span className="font-serif text-sm font-semibold text-primary-800">
                {roleTitle[role]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative"
              >
                {({ isActive: linkActive }) => (
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative overflow-hidden',
                      linkActive || isActive
                        ? 'bg-accent-gold/10 text-accent-gold-dark border border-accent-gold/40'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-800 border border-transparent'
                    )}
                  >
                    {(linkActive || isActive) && (
                      <motion.span
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-accent-gold rounded-r-full"
                      />
                    )}
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        (linkActive || isActive) && 'text-accent-gold'
                      )}
                    />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{ duration: 0.15 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 border-t border-primary-100"
          >
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <p className="text-xs text-primary-500">法援在线</p>
              <p className="text-xs text-primary-400 mt-0.5">公益法律服务平台</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
