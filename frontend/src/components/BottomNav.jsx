import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/discover', icon: Compass, label: '发现' },
  { path: '/publish', icon: PlusSquare, label: '发布' },
  { path: '/messages', icon: MessageCircle, label: '消息' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                isActive ? 'text-primary' : 'text-neutral-500'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
