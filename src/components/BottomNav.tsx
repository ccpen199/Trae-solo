import { Home, ListTodo, Coins, User, Gift } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: ListTodo, label: '任务', path: '/tasks' },
    { icon: Gift, label: '邀请', path: '/invite' },
    { icon: Coins, label: '金币', path: '/wallet' },
    { icon: User, label: '我的', path: '/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-dark-100 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? 'text-primary-500' : 'text-dark-400'
              }`}
            >
              <Icon size={22} className={active ? 'animate-pulse-slow' : ''} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
