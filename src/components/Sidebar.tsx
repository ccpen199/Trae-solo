import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileEdit, 
  Smartphone, 
  Activity, 
  GraduationCap, 
  Database, 
  Settings,
  Menu,
  X,
  Newspaper
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '数据大屏', badge: '' },
  { path: '/editor', icon: FileEdit, label: '编辑后台', badge: '5' },
  { path: '/reporter', icon: Smartphone, label: '记者移动端', badge: '' },
  { path: '/sentiment', icon: Activity, label: '舆情监测', badge: '新' },
  { path: '/training', icon: GraduationCap, label: '培训管理', badge: '' },
  { path: '/assets', icon: Database, label: '内容资产', badge: '' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  
  return (
    <aside className={`fixed left-0 top-0 h-full bg-dark-200 text-white transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-primary-400" />
            <span className="font-bold text-lg">昌平融媒</span>
          </div>
        )}
        <button 
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="mt-4 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      item.badge === '新' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      {!collapsed && (
        <div className="absolute bottom-4 left-2 right-2">
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="text-xs text-slate-400 mb-2">系统版本</div>
            <div className="text-sm">v1.0.0</div>
          </div>
        </div>
      )}
    </aside>
  );
}
