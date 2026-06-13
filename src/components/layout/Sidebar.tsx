import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Bell,
  Download,
  MapPin,
  Shield,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { path: '/dashboard', label: '健康看板', icon: LayoutDashboard },
  { path: '/monitor', label: '视频监控', icon: Video },
  { path: '/events', label: '侦测事件', icon: Bell },
  { path: '/ota', label: '固件升级', icon: Download },
  { path: '/geofence', label: '地理围栏', icon: MapPin },
  { path: '/privacy', label: '隐私存储', icon: Shield },
  { path: '/logs', label: '日志记录', icon: FileText },
];

export default function Sidebar() {
  const unreadCount = useAppStore((s) => s.unreadCount);

  return (
    <aside className="w-64 h-screen bg-deep-900 border-r border-deep-700 flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-deep-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-glow to-accent-secondary flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">猫眼智控</h1>
            <p className="text-[10px] text-slate-400 font-mono">v2.4.1</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-cyan-glow/20 to-transparent text-cyan-400 border-l-2 border-cyan-glow shadow-glow-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-deep-800'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
            {item.path === '/events' && unreadCount > 0 && (
              <span className="ml-auto bg-accent-danger text-white text-xs px-2 py-0.5 rounded-full font-mono">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-deep-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-deep-800 transition-colors">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </button>

        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-deep-800 to-deep-900 border border-deep-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-glow to-accent-secondary flex items-center justify-center text-white text-xs font-bold">
              管理
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">家庭管理员</p>
              <p className="text-[10px] text-slate-500 font-mono">admin@home.local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot online" />
            <span className="text-[10px] text-slate-500">安全连接 · 端到端加密</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
