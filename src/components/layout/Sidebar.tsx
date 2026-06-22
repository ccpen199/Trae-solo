import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  PiggyBank,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Radio,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import type { UserRole } from '../../types';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const dispatcherMenu: MenuItem[] = [
  { to: '/dispatcher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dispatcher/conflicts', label: '订单冲突', icon: AlertTriangle },
  { to: '/dispatcher/fusion', label: '熔断队列', icon: ShieldAlert },
];

const financeMenu: MenuItem[] = [
  { to: '/finance/overview', label: '财务概览', icon: BarChart3 },
  { to: '/finance/balances', label: '用户余额', icon: PiggyBank },
  { to: '/finance/settlements', label: '骑手结算', icon: Receipt },
  { to: '/finance/channels', label: '支付通道', icon: CreditCard },
];

const roleHeader: Record<UserRole, { label: string; icon: LucideIcon }> = {
  user: { label: '用户端', icon: LayoutDashboard },
  rider: { label: '骑手端', icon: LayoutDashboard },
  dispatcher: { label: '调度中心', icon: Radio },
  finance: { label: '财务中心', icon: Wallet },
};

export function Sidebar() {
  const currentRole = useAppStore((s) => s.currentRole);
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const collapsed = !isSidebarOpen;

  const menuItems =
    currentRole === 'finance' ? financeMenu : dispatcherMenu;
  const header = roleHeader[currentRole];
  const HeaderIcon = header.icon;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-dark border-r border-white/10 flex flex-col z-30"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <HeaderIcon className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h2 className="text-white font-semibold text-sm">
                {header.label}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 h-11 rounded-xl transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'text-sm font-medium whitespace-nowrap overflow-hidden',
                        isActive ? 'text-white' : 'text-white/80',
                      )}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-10 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">收起</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
