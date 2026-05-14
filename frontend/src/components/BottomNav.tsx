import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, PlusCircle, MessageCircle, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { path: '/planet', icon: Compass, label: '星球' },
    { path: '/', icon: Home, label: '广场' },
    { path: '/post', icon: PlusCircle, label: '发布' },
    { path: '/messages', icon: MessageCircle, label: '聊天' },
    { path: '/profile', icon: User, label: '自己' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-30">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {items.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isActive(path)
                ? 'text-pink-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 2} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
