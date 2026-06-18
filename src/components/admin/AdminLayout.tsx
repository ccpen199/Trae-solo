import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Bell, Landmark, Building2 } from 'lucide-react';
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
  if (pathname.includes('/poi')) return 'POI编辑';
  for (const [path, label] of Object.entries(breadcrumbMap)) {
    if (pathname === path || pathname.startsWith(path + '/')) return label;
  }
  return '';
}

const roleDisplay: Record<string, { label: string; icon: typeof Landmark; color: string }> = {
  museum: { label: '文博单位', icon: Landmark, color: 'text-indigo-400' },
  operator: { label: '景区运营方', icon: Building2, color: 'text-amber-500' },
};

export default function AdminLayout() {
  const location = useLocation();
  const { username, role, isLoggedIn } = useAuthStore();
  const pageTitle = getBreadcrumb(location.pathname);
  const roleInfo = roleDisplay[role] || roleDisplay.operator;

  if (!isLoggedIn || role === 'visitor') {
    return <Navigate to="/login" replace />;
  }

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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
              <roleInfo.icon size={12} className={roleInfo.color} />
              <span className="text-[10px] text-gray-400">{roleInfo.label}</span>
            </div>
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center">
                <roleInfo.icon size={14} className={roleInfo.color} />
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
