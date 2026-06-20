import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  WifiOff,
  ShoppingCart,
  FileText,
  MessageSquare,
  DollarSign,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import type { UserRole } from 'shared/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    path: '/',
    label: '工作台',
    icon: LayoutDashboard,
    roles: ['courier', 'admin', 'operator'],
  },
  {
    path: '/tasks',
    label: '揽收任务',
    icon: Package,
    roles: ['courier', 'admin', 'operator'],
  },
  {
    path: '/offline',
    label: '离线揽收',
    icon: WifiOff,
    roles: ['courier', 'admin', 'operator'],
  },
  {
    path: '/orders',
    label: '订单管理',
    icon: ShoppingCart,
    roles: ['admin', 'operator'],
  },
  {
    path: '/waybill',
    label: '电子面单',
    icon: FileText,
    roles: ['admin', 'operator'],
  },
  {
    path: '/messages',
    label: '消息中心',
    icon: MessageSquare,
    roles: ['courier', 'admin', 'operator'],
  },
  {
    path: '/finance',
    label: '财务对账',
    icon: DollarSign,
    roles: ['admin', 'operator'],
  },
  {
    path: '/couriers',
    label: '快递员管理',
    icon: Users,
    roles: ['admin', 'operator'],
  },
  {
    path: '/dashboard',
    label: '全局看板',
    icon: BarChart3,
    roles: ['admin', 'operator'],
  },
  {
    path: '/profile',
    label: '个人设置',
    icon: Settings,
    roles: ['courier', 'admin', 'operator'],
  },
];

export const Sidebar = () => {
  const { user } = useAuthStore();
  const { sidebarCollapsed } = useAppStore();

  const filteredMenuItems = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          {sidebarCollapsed ? (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-800">揽收管理</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        'hover:bg-gray-100 hover:text-gray-900',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600',
                        sidebarCollapsed && 'justify-center px-2'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role === 'courier'
                    ? '快递员'
                    : user.role === 'admin'
                    ? '管理员'
                    : '运营人员'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
