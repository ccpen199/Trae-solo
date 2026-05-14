import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User } from 'lucide-react';
import useStore from '../store/useStore';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: '/', icon: Compass, label: '星球' },
    { id: '/square', icon: Home, label: '广场' },
    { id: '/messages', icon: MessageCircle, label: '消息' },
    { id: '/profile', icon: User, label: '我的' },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-lg">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-2 py-2 shadow-lg">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition ${
                  isActive
                    ? 'text-purple-500 bg-purple-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;
