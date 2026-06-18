import { useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Home, Map, User } from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const tabs = [
  { label: '首页', icon: Home, pathPrefix: '/visitor/welcome' },
  { label: '导览', icon: Map, pathPrefix: '/visitor/guide' },
  { label: '我的', icon: User, pathPrefix: '/visitor/profile' },
];

export default function VisitorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ scenicId?: string }>();
  const { scenicAreas, currentScenicId, loadScenicAreas, selectScenic } = useScenicStore();
  const { role, isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (scenicAreas.length === 0) {
      loadScenicAreas();
    }
  }, [scenicAreas.length, loadScenicAreas]);

  useEffect(() => {
    const scenicId = params.scenicId;
    if (scenicId && scenicId !== currentScenicId) {
      selectScenic(scenicId);
    }
  }, [params.scenicId, currentScenicId, selectScenic]);

  const currentScenic = scenicAreas.find((s) => s.id === currentScenicId) || scenicAreas[0];
  const scenicName = currentScenic?.name || 'AR景区导览';
  const activeTab = tabs.find((t) => location.pathname.startsWith(t.pathPrefix));

  if (!isLoggedIn || role !== 'visitor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center p-8">
          <p className="text-gray-400 text-sm mb-4">游客身份未授权，正在跳转登录…</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-5 py-2 rounded-lg bg-amber-600/20 border border-amber-600/30 text-amber-500 text-sm hover:bg-amber-600/30 transition-colors"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] max-w-md mx-auto relative">
      <header className="sticky top-0 z-30 h-12 flex items-center px-4 border-b border-white/5 bg-[var(--bg-primary)]/90 backdrop-blur-md">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate('/visitor/welcome/scenic-1')}
          className="p-1 -ml-1 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-sm font-medium text-gray-200 truncate px-4">{scenicName}</h1>
        <div className="w-6" />
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 flex items-center justify-around border-t border-white/5 bg-[var(--bg-primary)]/95 backdrop-blur-md z-30">
        {tabs.map((tab) => {
          const isActive = activeTab?.pathPrefix === tab.pathPrefix;
          const targetId = currentScenicId || 'scenic-1';
          return (
            <Link
              key={tab.pathPrefix}
              to={`${tab.pathPrefix}/${targetId}`}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-4 transition-colors',
                isActive ? 'text-amber-600' : 'text-gray-500',
              )}
            >
              <tab.icon size={20} />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
