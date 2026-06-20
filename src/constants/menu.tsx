import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Users,
  Receipt,
  CalendarDays,
  ShoppingBag,
  Wallet,
  HeartPulse,
  Settings,
  FileBarChart,
  ShieldAlert,
  Home,
  CreditCard,
  UserCircle,
  Bell,
} from 'lucide-react';
import type { UserRole } from '@/types/entity';

export interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: MenuItem[];
}

export interface RoleMenuConfig {
  [key: string]: MenuItem[];
}

const SUPER_ADMIN_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: '数据概览',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'community',
    label: '小区管理',
    icon: Building2,
    path: '/community',
    children: [
      { key: 'community-list', label: '小区列表', icon: Building2, path: '/community/list' },
      { key: 'building', label: '楼栋管理', icon: Building2, path: '/community/buildings' },
      { key: 'room', label: '房屋管理', icon: Home, path: '/community/rooms' },
    ],
  },
  {
    key: 'work-order',
    label: '工单管理',
    icon: ClipboardList,
    path: '/work-order',
    children: [
      { key: 'work-order-list', label: '工单列表', icon: ClipboardList, path: '/work-order/list' },
      { key: 'work-order-sla', label: 'SLA预警', icon: ShieldAlert, path: '/work-order/sla' },
      { key: 'work-order-stats', label: '工单统计', icon: FileBarChart, path: '/work-order/stats' },
    ],
  },
  {
    key: 'user',
    label: '用户管理',
    icon: Users,
    path: '/user',
    children: [
      { key: 'user-list', label: '用户列表', icon: Users, path: '/user/list' },
      { key: 'user-role', label: '角色权限', icon: ShieldAlert, path: '/user/roles' },
    ],
  },
  {
    key: 'bill',
    label: '缴费管理',
    icon: Receipt,
    path: '/bill',
    children: [
      { key: 'bill-list', label: '账单列表', icon: Receipt, path: '/bill/list' },
      { key: 'bill-stats', label: '缴费统计', icon: FileBarChart, path: '/bill/stats' },
    ],
  },
  {
    key: 'activity',
    label: '活动管理',
    icon: CalendarDays,
    path: '/activity',
  },
  {
    key: 'mall',
    label: '商城管理',
    icon: ShoppingBag,
    path: '/mall',
    children: [
      { key: 'product', label: '商品管理', icon: ShoppingBag, path: '/mall/products' },
      { key: 'order', label: '订单管理', icon: CreditCard, path: '/mall/orders' },
    ],
  },
  {
    key: 'finance',
    label: '金融服务',
    icon: Wallet,
    path: '/finance',
  },
  {
    key: 'health',
    label: '健康管理',
    icon: HeartPulse,
    path: '/health',
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    path: '/settings',
  },
];

const COMMUNITY_ADMIN_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: '数据概览',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'work-order',
    label: '工单管理',
    icon: ClipboardList,
    path: '/work-order',
    children: [
      { key: 'work-order-list', label: '工单列表', icon: ClipboardList, path: '/work-order/list' },
      { key: 'work-order-sla', label: 'SLA预警', icon: ShieldAlert, path: '/work-order/sla' },
    ],
  },
  {
    key: 'user',
    label: '业主管理',
    icon: Users,
    path: '/user/list',
  },
  {
    key: 'bill',
    label: '缴费管理',
    icon: Receipt,
    path: '/bill',
    children: [
      { key: 'bill-list', label: '账单列表', icon: Receipt, path: '/bill/list' },
      { key: 'bill-stats', label: '缴费统计', icon: FileBarChart, path: '/bill/stats' },
    ],
  },
  {
    key: 'activity',
    label: '活动管理',
    icon: CalendarDays,
    path: '/activity',
  },
  {
    key: 'health',
    label: '健康管理',
    icon: HeartPulse,
    path: '/health',
  },
];

const PROPERTY_STAFF_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'work-order',
    label: '我的工单',
    icon: ClipboardList,
    path: '/work-order',
    children: [
      { key: 'work-order-list', label: '工单列表', icon: ClipboardList, path: '/work-order/list' },
      { key: 'work-order-sla', label: 'SLA预警', icon: ShieldAlert, path: '/work-order/sla' },
    ],
  },
  {
    key: 'activity',
    label: '社区活动',
    icon: CalendarDays,
    path: '/activity',
  },
];

const FINANCE_STAFF_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: '财务概览',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'bill',
    label: '缴费管理',
    icon: Receipt,
    path: '/bill',
    children: [
      { key: 'bill-list', label: '账单列表', icon: Receipt, path: '/bill/list' },
      { key: 'bill-stats', label: '缴费统计', icon: FileBarChart, path: '/bill/stats' },
    ],
  },
  {
    key: 'mall',
    label: '商城订单',
    icon: ShoppingBag,
    path: '/mall/orders',
  },
  {
    key: 'finance',
    label: '金融产品',
    icon: Wallet,
    path: '/finance',
  },
];

const SECURITY_STAFF_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'user',
    label: '住户信息',
    icon: Users,
    path: '/user/list',
  },
  {
    key: 'activity',
    label: '活动安保',
    icon: CalendarDays,
    path: '/activity',
  },
];

const RESIDENT_MENU: MenuItem[] = [
  {
    key: 'home',
    label: '首页',
    icon: Home,
    path: '/dashboard',
  },
  {
    key: 'work-order',
    label: '我的工单',
    icon: ClipboardList,
    path: '/work-order',
    children: [
      { key: 'work-order-list', label: '工单列表', icon: ClipboardList, path: '/work-order/list' },
      { key: 'work-order-create', label: '提交工单', icon: ClipboardList, path: '/work-order/create' },
    ],
  },
  {
    key: 'bill',
    label: '我的账单',
    icon: Receipt,
    path: '/bill/list',
  },
  {
    key: 'activity',
    label: '社区活动',
    icon: CalendarDays,
    path: '/activity',
  },
  {
    key: 'mall',
    label: '邻里商城',
    icon: ShoppingBag,
    path: '/mall',
    children: [
      { key: 'mall-products', label: '商品列表', icon: ShoppingBag, path: '/mall/products' },
      { key: 'mall-orders', label: '我的订单', icon: CreditCard, path: '/mall/orders' },
    ],
  },
  {
    key: 'finance',
    label: '金融服务',
    icon: Wallet,
    path: '/finance',
  },
  {
    key: 'health',
    label: '健康档案',
    icon: HeartPulse,
    path: '/health',
  },
  {
    key: 'profile',
    label: '个人中心',
    icon: UserCircle,
    path: '/profile',
    children: [
      { key: 'profile-info', label: '基本信息', icon: UserCircle, path: '/profile/info' },
      { key: 'profile-notifications', label: '消息通知', icon: Bell, path: '/profile/notifications' },
    ],
  },
];

export const MENU_CONFIG: Record<UserRole, MenuItem[]> = {
  SUPER_ADMIN: SUPER_ADMIN_MENU,
  COMMUNITY_ADMIN: COMMUNITY_ADMIN_MENU,
  PROPERTY_STAFF: PROPERTY_STAFF_MENU,
  FINANCE_STAFF: FINANCE_STAFF_MENU,
  SECURITY_STAFF: SECURITY_STAFF_MENU,
  RESIDENT: RESIDENT_MENU,
};

export const getMenuByRole = (role: UserRole): MenuItem[] => {
  return MENU_CONFIG[role] || RESIDENT_MENU;
};

export const findMenuItemByPath = (
  items: MenuItem[],
  path: string
): MenuItem | undefined => {
  for (const item of items) {
    if (item.path === path) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};
