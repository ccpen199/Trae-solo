import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  ChevronDown,
  Leaf,
  Search,
  PlusCircle,
  MapPin,
  Layers,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { 
    path: '/market', 
    label: '行情看板', 
    icon: TrendingUp,
    children: [
      { path: '/market', label: '实时行情' },
      { path: '/market/heatmap', label: '区域价差' },
      { path: '/market/trend', label: '历史走势' },
      { path: '/market/alert', label: '价格预警' },
    ]
  },
  { 
    path: '/supplies', 
    label: '货源交易', 
    icon: Package,
    children: [
      { path: '/supplies', label: '货源列表' },
      { path: '/supplies/publish', label: '发布货源' },
    ]
  },
  { 
    path: '/stations', 
    label: '回收站', 
    icon: Building2,
    children: [
      { path: '/stations', label: '回收站列表' },
    ]
  },
  { 
    path: '/alliance', 
    label: '联盟管理', 
    icon: Users,
    children: [
      { path: '/alliance', label: '联盟首页' },
      { path: '/alliance/structure', label: '组织架构' },
      { path: '/alliance/tasks', label: '任务管理' },
      { path: '/alliance/settlement', label: '结算分账' },
    ]
  },
  { 
    path: '/dashboard', 
    label: '数据看板', 
    icon: BarChart3,
    children: [
      { path: '/dashboard', label: '综合概览' },
      { path: '/dashboard/supply-demand', label: '供需分析' },
      { path: '/dashboard/funnel', label: '转化漏斗' },
    ]
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/market', '/supplies']);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isMenuActive = (item: typeof menuItems[0]) => {
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              再生资源平台
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mx-auto">
            <Leaf className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item);
            const expanded = expandedMenus.includes(item.path);

            return (
              <li key={item.path}>
                <button
                  onClick={() => toggleMenu(item.path)}
                  className={cn(
                    'w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    active 
                      ? 'bg-gradient-to-r from-green-600/20 to-green-500/10 text-green-400 border-l-2 border-green-500' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-green-400' : 'group-hover:text-green-400 transition-colors')} />
                  {!collapsed && (
                    <>
                      <span className="ml-3 font-medium flex-1 text-left">{item.label}</span>
                      {item.children && (
                        <ChevronDown className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          expanded && 'rotate-180'
                        )} />
                      )}
                    </>
                  )}
                </button>
                
                {!collapsed && expanded && item.children && (
                  <ul className="mt-1 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <NavLink
                          to={child.path}
                          className={({ isActive }) => cn(
                            'flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200',
                            isActive
                              ? 'text-green-400 bg-green-500/10'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-50" />
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/10 rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
              <PlusCircle className="w-4 h-4" />
              <span>快速操作</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NavLink to="/supplies/publish" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
                <PlusCircle className="w-3 h-3" />
                发布货源
              </NavLink>
              <NavLink to="/market/alert" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
                <Bell className="w-3 h-3" />
                设置预警
              </NavLink>
              <NavLink to="/supplies" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
                <Search className="w-3 h-3" />
                搜索货源
              </NavLink>
              <NavLink to="/stations" className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                查找站点
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
