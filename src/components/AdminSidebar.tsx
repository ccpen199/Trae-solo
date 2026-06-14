import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileText,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/admin/dashboard', label: '数据概览', icon: LayoutDashboard },
  { path: '/admin/workers', label: '阿姨审核', icon: Users },
  { path: '/admin/dispatch', label: '调度中心', icon: MapPin },
  { path: '/admin/sop', label: 'SOP文档库', icon: FileText },
  { path: '/admin/insurance', label: '保险配置', icon: Shield },
  { path: '/admin/qa', label: '质检分析', icon: BarChart3 },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen bg-secondary-800 text-white flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
              <span className="font-bold">暖</span>
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">管理后台</h2>
              <p className="text-xs text-secondary-300">暖心到家</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
            <span className="font-bold">暖</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  'hover:bg-secondary-700/60',
                  isActive
                    ? 'bg-secondary-600 text-white shadow-lg shadow-secondary-900/30'
                    : 'text-secondary-200',
                  collapsed && 'justify-center px-2'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-secondary-700 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary-200 hover:bg-secondary-700/60 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">收起菜单</span>
            </>
          )}
        </button>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary-200 hover:bg-red-600/20 hover:text-red-300 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
