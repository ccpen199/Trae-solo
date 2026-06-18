import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  Users,
  ShoppingCart,
  FileCode,
  Handshake,
  Storefront,
  Link,
  Pulse,
  MapPin,
  Scan,
  CaretDoubleLeft,
  CaretDoubleRight,
  Hexagon,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: Gauge },
  { path: '/holder', label: '持券人中心', icon: Users },
  { path: '/market', label: '权益兑换', icon: ShoppingCart },
  { path: '/contract', label: '智能合约', icon: FileCode },
  { path: '/partner', label: '合作方', icon: Handshake },
  { path: '/merchant', label: '商户管理', icon: Storefront },
  { path: '/blockchain', label: '区块链存证', icon: Link },
  { path: '/health', label: '权益监控', icon: Pulse },
  { path: '/ar-fence', label: 'AR地理围栏', icon: MapPin },
  { path: '/verify', label: '核销中心', icon: Scan },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 248 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 h-screen glass-card border-r border-gold-400/15 flex flex-col"
    >
      <div className="relative flex h-16 items-center gap-3 px-4 border-b border-gold-400/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300/30 to-gold-500/10 border border-gold-400/30">
          <Hexagon weight="fill" className="h-5 w-5 text-gold-300" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="text-sm font-bold gold-gradient-text tracking-wider">权益链</div>
              <div className="text-[10px] text-gold-400/60 tracking-[0.2em]">FUSIONCHAIN</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-space-800 border border-gold-400/30 text-gold-300 hover:bg-space-700 hover:border-gold-400/60 transition-all"
        >
          {sidebarCollapsed ? (
            <CaretDoubleRight size={12} weight="bold" />
          ) : (
            <CaretDoubleLeft size={12} weight="bold" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-gold-200 bg-gradient-to-r from-gold-400/15 to-transparent border border-gold-400/25'
                  : 'text-gray-400 hover:text-gold-200 hover:bg-space-800/60 border border-transparent'
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-gold-200 to-gold-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} className={cn(isActive && 'text-gold-300')} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gold-400/10">
        <div className={cn(
          'flex items-center gap-3 rounded-xl bg-space-900/60 px-3 py-2.5 border border-gold-400/10',
          sidebarCollapsed && 'justify-center'
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-300/25 to-gold-500/10 text-gold-300 text-xs font-bold border border-gold-400/25">
            QL
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1"
              >
                <div className="text-sm font-medium text-gold-100 truncate">权益链管理员</div>
                <div className="text-[11px] text-gray-400">超级管理员</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
