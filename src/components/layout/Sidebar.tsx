import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserRole = 'admin' | 'property' | 'resident' | 'maintenance';

export interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['admin', 'property', 'resident', 'maintenance'],
  },
  {
    key: 'workorder',
    label: '工单管理',
    icon: FileText,
    roles: ['admin', 'property', 'maintenance'],
    children: [
      { key: 'workorder-list', label: '工单列表', icon: FileText, path: '/workorder/list', roles: ['admin', 'property', 'maintenance'] },
      { key: 'workorder-create', label: '新建工单', icon: FileText, path: '/workorder/create', roles: ['admin', 'property', 'resident'] },
      { key: 'workorder-mine', label: '我的工单', icon: FileText, path: '/workorder/mine', roles: ['resident', 'maintenance'] },
    ],
  },
  {
    key: 'community',
    label: '小区管理',
    icon: Building2,
    roles: ['admin', 'property'],
    children: [
      { key: 'community-building', label: '楼宇管理', icon: Building2, path: '/community/building', roles: ['admin', 'property'] },
      { key: 'community-household', label: '住户信息', icon: Users, path: '/community/household', roles: ['admin', 'property'] },
    ],
  },
  {
    key: 'activity',
    label: '社区活动',
    icon: Calendar,
    path: '/activity',
    roles: ['admin', 'property', 'resident'],
  },
  {
    key: 'payment',
    label: '缴费管理',
    icon: DollarSign,
    roles: ['admin', 'property', 'resident'],
    children: [
      { key: 'payment-list', label: '缴费记录', icon: DollarSign, path: '/payment/list', roles: ['admin', 'property', 'resident'] },
      { key: 'payment-unpaid', label: '待缴费用', icon: DollarSign, path: '/payment/unpaid', roles: ['resident'] },
    ],
  },
  {
    key: 'statistics',
    label: '数据统计',
    icon: BarChart3,
    path: '/statistics',
    roles: ['admin', 'property'],
  },
  {
    key: 'user',
    label: '用户管理',
    icon: Users,
    path: '/user',
    roles: ['admin'],
  },
  {
    key: 'permission',
    label: '权限管理',
    icon: Shield,
    path: '/permission',
    roles: ['admin'],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    path: '/settings',
    roles: ['admin'],
  },
];

interface SidebarProps {
  collapsed: boolean;
  role?: UserRole;
}

function filterMenuByRole(items: MenuItem[], role: UserRole): MenuItem[] {
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuByRole(item.children, role) : undefined,
    }));
}

interface MenuItemNodeProps {
  item: MenuItem;
  collapsed: boolean;
  level?: number;
}

function MenuItemNode({ item, collapsed, level = 0 }: MenuItemNodeProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const isChildActive = hasChildren && item.children?.some(
    (child) => child.path && location.pathname.startsWith(child.path)
  );

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'nav-item w-full',
            isChildActive && 'nav-item-active'
          )}
          style={{ paddingLeft: `${16 + level * 16}px` }}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </motion.div>
            </>
          )}
        </button>
        <AnimatePresence>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children!.map((child) => (
                <MenuItemNode
                  key={child.key}
                  item={child}
                  collapsed={collapsed}
                  level={level + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      className={({ isActive }) =>
        cn('nav-item', isActive && 'nav-item-active')
      }
      style={{ paddingLeft: `${16 + level * 16}px` }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed, role = 'admin' }: SidebarProps) {
  const filteredItems = filterMenuByRole(menuItems, role);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-screen sticky top-0 border-r border-white/10 bg-neutral-950/80 backdrop-blur-xl flex flex-col"
    >
      <div className="h-16 flex items-center justify-center border-b border-white/10 px-4">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-serif text-lg font-bold text-gradient-primary">
              智慧物业
            </span>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {filteredItems.map((item) => (
          <MenuItemNode key={item.key} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">管理员</div>
              <div className="text-xs text-neutral-500 truncate">admin@community.com</div>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
