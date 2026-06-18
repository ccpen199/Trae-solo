import { Outlet, useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';

const breadcrumbMap: Record<string, string> = {
  '/admin/dashboard': '数据看板',
  '/admin/scenic': '景区管理',
  '/admin/ab-test': 'AB测试',
  '/admin/analytics': '数据分析',
};

function getBreadcrumb(pathname: string) {
  if (pathname.includes('/ar-editor')) return 'AR编辑器';
  for (const [path, label] of Object.entries(breadcrumbMap)) {
    if (pathname === path || pathname.startsWith(path + '/')) return label;
  }
  return '';
}

export default function AdminLayout() {
  const location = useLocation();
  const { username } = useAuthStore();
  const pageTitle = getBreadcrumb(location.pathname);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div className="flex-1 ml-60 flex flex-col">
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[var(--bg-primary)]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-medium text-gray-200">{pageTitle}</h2>
            <span className="text-xs text-gray-600">/</span>
            <span className="text-xs text-gray-500">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center">
                <User size={14} className="text-amber-500" />
              </div>
              <span className="text-sm text-gray-400">{username}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
