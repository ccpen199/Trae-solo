import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  MapPin,
  Receipt,
  CreditCard,
  Users,
  Settings,
  Search,
  ClipboardList,
  Shield,
} from 'lucide-react';
import { useUserStore, selectUserRole } from '../../store/user';
import { useAppStore, selectSidebarCollapsed } from '../../store/app';
import type { UserRole } from '../../../shared/types';
import { cn } from '../../lib/utils';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页',
    icon: <LayoutDashboard size={20} />,
    path: '/',
    roles: ['owner', 'fleet', 'driver', 'operator', 'admin'],
  },
  {
    key: 'price-query',
    label: '运价查询',
    icon: <Search size={20} />,
    path: '/price-query',
    roles: ['owner', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'cargo-publish',
    label: '发布货源',
    icon: <Package size={20} />,
    path: '/cargo/publish',
    roles: ['owner', 'operator', 'admin'],
  },
  {
    key: 'cargo-list',
    label: '货源列表',
    icon: <ClipboardList size={20} />,
    path: '/cargo/list',
    roles: ['owner', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'orders',
    label: '订单管理',
    icon: <FileText size={20} />,
    path: '/orders',
    roles: ['owner', 'fleet', 'driver', 'operator', 'admin'],
  },
  {
    key: 'waybills',
    label: '运单管理',
    icon: <Truck size={20} />,
    path: '/waybills',
    roles: ['owner', 'fleet', 'driver', 'operator', 'admin'],
  },
  {
    key: 'tracking',
    label: '轨迹追踪',
    icon: <MapPin size={20} />,
    path: '/tracking',
    roles: ['owner', 'fleet', 'driver', 'operator', 'admin'],
  },
  {
    key: 'bills',
    label: '账单管理',
    icon: <Receipt size={20} />,
    path: '/bills',
    roles: ['owner', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'settlement',
    label: '结算中心',
    icon: <CreditCard size={20} />,
    path: '/settlement',
    roles: ['owner', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'capacity',
    label: '运力管理',
    icon: <Users size={20} />,
    path: '/capacity',
    roles: ['owner', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'auth',
    label: '认证中心',
    icon: <Shield size={20} />,
    path: '/auth',
    roles: ['driver', 'fleet', 'operator', 'admin'],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: <Settings size={20} />,
    path: '/settings',
    roles: ['admin'],
  },
];

const roleLabels: Record<UserRole, string> = {
  owner: '货主',
  fleet: '车队',
  driver: '司机',
  operator: '运营',
  admin: '管理员',
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const userRole = useUserStore(selectUserRole);
  const collapsed = useAppStore(selectSidebarCollapsed);

  const filteredMenuItems = menuItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
        {collapsed ? (
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">货运数字化平台</h1>
              {userRole && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {roleLabels[userRole]}端
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  collapsed && 'justify-center px-0'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0',
                    isActive(item.path)
                      ? 'text-white'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-500'
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-gradient-to-r from-primary-500 to-cyan-500 rounded-lg p-4 text-white">
            <p className="text-sm font-medium mb-1">需要帮助？</p>
            <p className="text-xs opacity-90">联系客服获取技术支持</p>
            <button className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 rounded-md transition-colors">
              联系客服
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
