import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileText, Briefcase, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabBarProps {
  className?: string;
}

const tabs = [
  { label: '首页', path: '/', icon: Home },
  { label: '爆料', path: '/baoliao', icon: FileText },
  { label: '服务', path: '/services', icon: Briefcase },
  { label: '消息', path: '/messages', icon: MessageCircle },
  { label: '我的', path: '/profile', icon: User },
];

export default function TabBar({ className }: TabBarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-neutral-200 z-50 pb-safe',
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                active ? 'text-westlake-600' : 'text-neutral-400'
              )}
            >
              <motion.div
                className="relative flex flex-col items-center"
                animate={{ y: active ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {active && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute -top-3 w-12 h-1 bg-westlake-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-6 h-6 transition-all',
                    active ? 'scale-110' : 'scale-100'
                  )}
                />
                <span
                  className={cn(
                    'text-xs mt-1 transition-all',
                    active ? 'font-semibold' : 'font-normal'
                  )}
                >
                  {tab.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
