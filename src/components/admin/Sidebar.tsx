import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Box, Split, BarChart3, LogOut, Landmark, Building2, BookOpen, FileText, Volume2, MapPin, Route } from 'lucide-react';
import { useAuthStore, type UserRole } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles: UserRole[];
}

const allNavItems: NavItem[] = [
  { label: '数据看板', icon: LayoutDashboard, path: '/admin/dashboard', roles: ['museum', 'operator'] },
  { label: '景区管理', icon: Map, path: '/admin/scenic', roles: ['operator'] },
  { label: 'POI点位管理', icon: MapPin, path: '/admin/scenic/1/poi', roles: ['operator'] },
  { label: 'AR内容包', icon: Box, path: '/admin/scenic/1/ar-editor', roles: ['museum', 'operator'] },
  { label: '导览动线配置', icon: Route, path: '/admin/scenic', roles: ['operator'] },
  { label: '讲解脚本', icon: BookOpen, path: '/admin/ab-test', roles: ['museum'] },
  { label: '多语言配音', icon: Volume2, path: '/admin/ab-test', roles: ['museum'] },
  { label: 'AB测试', icon: Split, path: '/admin/ab-test', roles: ['museum', 'operator'] },
  { label: '数据分析', icon: BarChart3, path: '/admin/analytics', roles: ['museum', 'operator'] },
  { label: '文化史料', icon: FileText, path: '/admin/scenic', roles: ['museum'] },
];

const roleConfig: Record<UserRole, { label: string; icon: typeof Landmark; color: string; bgColor: string }> = {
  museum: { label: '文博单位', icon: Landmark, color: 'text-indigo-400', bgColor: 'bg-indigo-800/40' },
  operator: { label: '景区运营方', icon: Building2, color: 'text-amber-500', bgColor: 'bg-amber-900/30' },
  visitor: { label: '游客', icon: Map, color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, role, logout } = useAuthStore();
  const config = roleConfig[role] || roleConfig.operator;
  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-indigo-950 flex flex-col border-r border-white/5">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide">
          AR导览
          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-600 align-super" />
        </h1>
        <p className="text-xs text-amber-600/80 mt-1 tracking-widest">内容管理系统</p>
        <div className={cn('mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', config.bgColor)}>
          <config.icon size={12} className={config.color} />
          <span className={cn('text-[10px] font-medium', config.color)}>{config.label}工作台</span>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-4" />

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.label}
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
            <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-medium shrink-0">
              <config.icon size={14} className={config.color} />
            </div>
            <span className="text-sm text-gray-300 truncate">{username || '未登录'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
