import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Package,
  QrCode,
  BarChart3,
  AlertTriangle,
  Shield,
  Store,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/coupons', label: '优惠券管理', icon: Ticket },
  { path: '/inventory', label: '库存管理', icon: Package },
  { path: '/verification', label: '核销管理', icon: QrCode },
  { path: '/reports', label: '数据报表', icon: BarChart3 },
  { path: '/alerts', label: '告警中心', icon: AlertTriangle },
  { path: '/risk-control', label: '风控管理', icon: Shield },
  { path: '/merchants', label: '商户管理', icon: Store },
  { path: '/provincial', label: '省级对接', icon: Building2 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-gray-100 flex flex-col transition-all duration-300 h-screen sticky top-0`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-800">福利券平台</span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        {!collapsed && (
          <div className="text-xs text-gray-400 text-center">
            沈阳市福利券管理平台
          </div>
        )}
      </div>
    </aside>
  );
}
