import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Map,
  MessageSquare,
  CheckSquare,
  Layers,
  AlertTriangle,
  TrendingUp,
  Settings,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '控制台首页', icon: LayoutDashboard },
  { path: '/content', label: '内容管理', icon: FileText },
  { path: '/gis-map', label: 'GIS地图', icon: Map },
  { path: '/appeal', label: '市民诉求', icon: MessageSquare },
  { path: '/audit', label: '内容审核', icon: CheckSquare },
  { path: '/tiered', label: '分级发布', icon: Layers },
  { path: '/emergency', label: '应急管理', icon: AlertTriangle, badge: '3' },
  { path: '/public-opinion', label: '舆情分析', icon: TrendingUp },
];

const systemMenuItems: MenuItem[] = [
  { path: '/settings', label: '系统设置', icon: Settings },
  { path: '/settings/users', label: '用户管理', icon: Users },
  { path: '/settings/roles', label: '角色权限', icon: Shield },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentPath } = useAppStore();
  const location = useLocation();

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname.startsWith(item.path);
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          'group flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary-700 text-white shadow-md'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base">徐州广电</h1>
              <p className="text-slate-400 text-xs">城市信息服务平台</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <div className="py-4 px-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="mb-2">
          {!sidebarCollapsed && (
            <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              工作平台
            </p>
          )}
          <nav className="space-y-1">
            {menuItems.map(renderMenuItem)}
          </nav>
        </div>

        <div className="my-4 border-t border-slate-800 pt-4">
          {!sidebarCollapsed && (
            <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              系统管理
            </p>
          )}
          <nav className="space-y-1">
            {systemMenuItems.map(renderMenuItem)}
          </nav>
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
