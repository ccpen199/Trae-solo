import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  Eye,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard },
  { path: '/properties', label: '房源中心', icon: Building2 },
  { path: '/agents', label: '经纪人工作台', icon: Users },
  { path: '/buyers', label: '购房者中心', icon: UserCircle },
  { path: '/vr-analytics', label: 'VR看房分析', icon: Eye },
  { path: '/dispatch', label: '智能派单', icon: ClipboardList },
  { path: '/admin', label: '管理后台', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-primary-800 via-primary-700 to-primary-900 text-white z-50 transition-all duration-300 flex flex-col',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-serif text-sm font-bold leading-tight text-white">房产可信协作</h1>
            <p className="text-[10px] text-primary-200 leading-tight">Trusted Realty Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center mx-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                active
                  ? 'bg-white/15 text-gold-300 shadow-sm'
                  : 'text-primary-100 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-gold-300')} />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gold-400 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-white/10 hover:bg-white/8 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-primary-200" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-primary-200" />
        )}
      </button>
    </aside>
  );
}
