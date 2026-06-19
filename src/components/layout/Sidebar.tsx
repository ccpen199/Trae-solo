import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
  AlertTriangle,
  Award,
  Code2,
  Map,
} from 'lucide-react';
import type { NavItem } from '@/types';
import { cn } from '@/lib/utils';

const navItems: NavItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: 'LayoutDashboard', path: '/' },
  { key: 'orders', label: '订单管理', icon: 'Package', path: '/orders' },
  { key: 'abnormal-orders', label: '异常订单', icon: 'AlertTriangle', path: '/abnormal-orders', badge: 5 },
  { key: 'riders', label: '骑手管理', icon: 'Users', path: '/riders' },
  { key: 'rider-credit', label: '信用分体系', icon: 'Award', path: '/rider-credit' },
  { key: 'heatmap', label: '运力热力图', icon: 'Map', path: '/heatmap' },
  { key: 'waybills', label: '运单中心', icon: 'FileText', path: '/waybills' },
  { key: 'compensation', label: '赔付管理', icon: 'Receipt', path: '/compensation' },
  { key: 'pricing', label: '定价配置', icon: 'Settings', path: '/pricing' },
  { key: 'api-integration', label: 'API集成', icon: 'Code2', path: '/api-integration' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Receipt,
  Settings,
  Truck,
  AlertTriangle,
  Award,
  Code2,
  Map,
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: externalCollapsed, onToggle }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed ?? internalCollapsed;

  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  return (
    <aside
      className={cn(
        'h-screen bg-space-blue-800 border-r border-space-blue-600 flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-space-blue-600">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-accent-500 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-space-blue-900" />
            </div>
            <span className="font-bold text-lg text-gradient-amber">物流管理</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-amber-accent-500 rounded-lg flex items-center justify-center mx-auto">
            <Truck className="w-5 h-5 text-space-blue-900" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || LayoutDashboard;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-amber-accent-500/20 text-amber-accent-400 shadow-glow-amber'
                    : 'text-gray-400 hover:bg-space-blue-700 hover:text-gray-100'
                )
              }
            >
              <IconComponent className={cn('w-5 h-5 flex-shrink-0', collapsed ? 'mx-auto' : '')} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-space-blue-600 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-space-blue-600">
        <div className="px-3 py-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative w-full',
                isActive
                  ? 'bg-amber-accent-500/20 text-amber-accent-400 shadow-glow-amber'
                  : 'text-gray-400 hover:bg-space-blue-700 hover:text-gray-100'
              )
            }
          >
            <Settings className={cn('w-5 h-5 flex-shrink-0', collapsed ? 'mx-auto' : '')} />
            {!collapsed && (
              <span className="text-sm font-medium">个人设置</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-space-blue-600 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                个人设置
              </div>
            )}
          </NavLink>
        </div>
        <div className="p-3 border-t border-space-blue-600">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-space-blue-700 hover:text-gray-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
