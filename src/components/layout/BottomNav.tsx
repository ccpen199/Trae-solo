import { NavLink } from 'react-router-dom';
import { Home, Plus, ClipboardList, User, Briefcase, Wallet } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const userNavItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/publish', label: '发布', icon: Plus },
  { to: '/orders', label: '订单', icon: ClipboardList },
  { to: '/profile', label: '我的', icon: User },
];

const riderNavItems: NavItem[] = [
  { to: '/rider', label: '工作台', icon: Briefcase },
  { to: '/rider/order/demo', label: '当前单', icon: ClipboardList },
  { to: '/rider/wallet', label: '钱包', icon: Wallet },
  { to: '/rider/profile', label: '我的', icon: User },
];

export function BottomNav() {
  const currentRole = useAppStore((s) => s.currentRole);
  const navItems = currentRole === 'rider' ? riderNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'relative p-1.5 rounded-xl transition-all',
                    isActive && 'bg-primary/10',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform',
                      isActive && 'scale-110',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    isActive ? 'text-primary' : 'text-gray-500',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
