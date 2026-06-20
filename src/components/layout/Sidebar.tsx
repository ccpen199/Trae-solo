import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  ShoppingCart,
  Heart,
  Shield,
  Settings,
  Landmark,
  User,
  Building2 as BuildingIcon,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUserStore } from '@/store/userStore';
import type { UserRole } from '@/types/entity';
import { desensitizeName } from '@/utils/desensitize';

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
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'SECURITY_STAFF', 'RESIDENT'],
  },
  {
    key: 'workorder',
    label: '工单管理',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'SECURITY_STAFF', 'RESIDENT'],
    children: [
      { key: 'workorder-list', label: '工单列表', icon: FileText, path: '/work-order', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'SECURITY_STAFF', 'RESIDENT'] },
      { key: 'workorder-create', label: '新建工单', icon: FileText, path: '/work-order/create', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'RESIDENT'] },
    ],
  },
  {
    key: 'community',
    label: '小区管理',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'SECURITY_STAFF'],
    children: [
      { key: 'community-list', label: '小区列表', icon: BuildingIcon, path: '/community', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'SECURITY_STAFF'] },
      { key: 'community-building', label: '楼宇结构', icon: Building2, path: '/community/c001', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF'] },
    ],
  },
  {
    key: 'mall',
    label: '社区电商',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT'],
    children: [
      { key: 'mall-home', label: '商品中心', icon: ShoppingCart, path: '/mall', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT'] },
      { key: 'mall-orders', label: '我的订单', icon: FileText, path: '/mall/orders', roles: ['RESIDENT'] },
      { key: 'mall-merchant', label: '商户管理', icon: Users, path: '/mall/merchant', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN'] },
    ],
  },
  {
    key: 'activity',
    label: '邻里活动',
    icon: Calendar,
    path: '/activity',
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'RESIDENT'],
  },
  {
    key: 'finance',
    label: '普惠金融',
    icon: Landmark,
    path: '/finance',
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT'],
  },
  {
    key: 'health',
    label: '健康档案',
    icon: Heart,
    path: '/health',
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT'],
  },
  {
    key: 'payment',
    label: '缴费中心',
    icon: DollarSign,
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'RESIDENT'],
    children: [
      { key: 'payment-center', label: '缴费中心', icon: DollarSign, path: '/payment', roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'RESIDENT'] },
    ],
  },
  {
    key: 'committee',
    label: '业委会审核',
    icon: Shield,
    path: '/committee/review',
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN'],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
    children: [
      { key: 'settings-roles', label: '角色权限', icon: Shield, path: '/settings/roles', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    key: 'profile',
    label: '个人中心',
    icon: User,
    path: '/profile',
    roles: ['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'PROPERTY_STAFF', 'FINANCE_STAFF', 'SECURITY_STAFF', 'RESIDENT'],
  },
];

const roleNameMap: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  COMMUNITY_ADMIN: '小区管理员',
  PROPERTY_STAFF: '物业管家',
  FINANCE_STAFF: '财务人员',
  SECURITY_STAFF: '安保人员',
  RESIDENT: '业主',
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
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
  defaultOpen?: boolean;
}

function MenuItemNode({ item, collapsed, level = 0, defaultOpen }: MenuItemNodeProps) {
  const location = useLocation();
  const [open, setOpen] = useState(defaultOpen || false);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const isChildActive =
    hasChildren && item.children?.some((child) => child.path && location.pathname.startsWith(child.path));

  const isActive = item.path && location.pathname === item.path;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'nav-item w-full',
            isChildActive && 'nav-item-active',
            isActive && 'nav-item-active'
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

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { user } = useUserStore();
  const role = user?.role || 'RESIDENT';
  const filteredItems = filterMenuByRole(menuItems, role);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-screen sticky top-0 border-r border-white/10 bg-neutral-950/80 backdrop-blur-xl flex flex-col z-40"
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
              智居云
            </span>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {filteredItems.map((item, index) => (
          <MenuItemNode
            key={item.key}
            item={item}
            collapsed={collapsed}
            defaultOpen={index < 3}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user ? desensitizeName(user.realName) : '用户'}
              </div>
              <div className="text-xs text-neutral-500 truncate">
                {user ? roleNameMap[user.role] : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
