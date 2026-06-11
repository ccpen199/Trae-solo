import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const MobileLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: 'home', label: '首页', icon: '🏠', path: '/h5' },
    { key: 'content', label: '内容', icon: '📚', path: '/h5/content' },
    { key: 'scenic', label: '景区', icon: '🏔️', path: '/h5/scenic' },
    { key: 'service', label: '服务', icon: '⚙️', path: '/h5/service' },
    { key: 'profile', label: '我的', icon: '👤', path: '/h5/profile' },
  ];

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
              文
            </div>
            <h1 className="font-bold text-lg">文旅中台</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="p-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 min-w-[60px] ${isActive ? 'text-primary-600' : 'text-ink-500'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
