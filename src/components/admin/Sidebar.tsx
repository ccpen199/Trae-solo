import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Box, Split, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
  { label: '数据看板', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: '景区管理', icon: Map, path: '/admin/scenic' },
  { label: 'AR编辑器', icon: Box, path: '/admin/scenic/1/ar-editor' },
  { label: 'AB测试', icon: Split, path: '/admin/ab-test' },
  { label: '数据分析', icon: BarChart3, path: '/admin/analytics' },
];

export default function Sidebar() {
  const location = useLocation();
  const { username, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-indigo-950 flex flex-col border-r border-white/5">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide">
          AR导览
          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-600 align-super" />
        </h1>
        <p className="text-xs text-amber-600/80 mt-1 tracking-widest">内容管理系统</p>
      </div>

      <div className="h-px bg-white/5 mx-4" />

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative',
                isActive
                  ? 'text-amber-500 bg-white/[0.06] font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-600 rounded-r" />
              )}
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-medium text-amber-500 shrink-0">
              {username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-gray-300 truncate">{username || '未登录'}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
