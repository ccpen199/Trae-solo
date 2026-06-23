import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, Grid3X3, User } from 'lucide-react';

const tabs = [
  { path: '/home', label: '首页', icon: Home },
  { path: '/activities', label: '活动', icon: Calendar },
  { path: '/mall', label: '商城', icon: ShoppingBag },
  { path: '/legal', label: '服务', icon: Grid3X3 },
  { path: '/profile', label: '我的', icon: User },
];

export default function H5Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path || '/home';

  return (
    <div className="min-h-screen bg-union-bg flex flex-col">
      <header className="sticky top-0 z-50 bg-white shadow-sm px-4 h-12 flex items-center">
        {location.pathname !== '/home' && (
          <button onClick={() => navigate(-1)} className="mr-3 text-union-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold text-union-text flex-1 text-center pr-8">
          杭州工会
        </h1>
      </header>

      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-union-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
