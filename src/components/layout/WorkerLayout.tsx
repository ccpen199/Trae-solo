import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, CalendarCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/worker', icon: Home, label: '首页' },
  { path: '/worker/interview', icon: CalendarCheck, label: '面试' },
  { path: '/worker/profile', icon: User, label: '我的' },
];

export default function WorkerLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
              <span className="text-white text-xs font-bold">蓝</span>
            </div>
            <span className="text-sm font-bold text-brand-600">蓝领用工</span>
          </div>
          <Link to="/" className="text-xs text-gray-400 hover:text-brand-600">返回门户</Link>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = pathname === tab.path || (tab.path !== '/worker' && pathname.startsWith(tab.path));
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-20 h-full transition-colors',
                  active ? 'text-accent-500' : 'text-gray-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
