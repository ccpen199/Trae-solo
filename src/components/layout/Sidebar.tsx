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
  PieChart,
  LayoutDashboard,
  FileText,
  ClipboardList,
  CreditCard,
  Heart,
  ShoppingCart,
  CalendarDays,
  UserCheck,
  ArrowRightLeft,
  Receipt,
  ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '../../../shared/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

type MenuKey = 'workspace' | 'market' | 'supplies' | 'stations' | 'alliance' | 'dashboard';

interface MenuChild {
  path: string;
  label: string;
}

interface MenuItem {
  key: MenuKey;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: (UserRole | 'guest')[];
  children: MenuChild[];
  childrenByRole?: Record<UserRole, MenuChild[]>;
  labelByRole?: Record<UserRole, string>;
}

const workspaceChildrenByRole: Record<UserRole, MenuChild[]> = {
  supplier: [
    { path: '/workspace/supplies', label: '我的货源' },
    { path: '/workspace/stations', label: '回收站管理' },
    { path: '/workspace/inquiries', label: '待处理询价' },
    { path: '/workspace/transactions', label: '交易记录' },
  ],
  buyer: [
    { path: '/workspace/quotes', label: '待处理报价' },
    { path: '/workspace/favorites', label: '我的收藏' },
    { path: '/workspace/orders', label: '采购订单' },
    { path: '/workspace/transactions', label: '交易记录' },
  ],
  operator: [
    { path: '/workspace/overview', label: '今日概况' },
    { path: '/workspace/tasks', label: '待审核任务' },
    { path: '/workspace/settlements', label: '结算审批' },
    { path: '/workspace/members', label: '成员管理' },
  ],
};

const suppliesLabelByRole: Record<UserRole, string> = {
  supplier: '货源管理',
  buyer: '货源交易',
  operator: '货源交易',
};

const suppliesChildrenByRole: Record<UserRole, MenuChild[]> = {
  supplier: [
    { path: '/supplies/my', label: '我的货源' },
    { path: '/supplies/publish', label: '发布货源' },
  ],
  buyer: [
    { path: '/supplies', label: '货源市场' },
    { path: '/supplies/inquiries', label: '我的询价' },
    { path: '/supplies/favorites', label: '我的收藏' },
  ],
  operator: [
    { path: '/supplies', label: '货源列表' },
    { path: '/supplies/publish', label: '发布货源' },
  ],
};

const stationsLabelByRole: Record<UserRole, string> = {
  supplier: '回收站管理',
  buyer: '回收站',
  operator: '回收站',
};

const stationsChildrenByRole: Record<UserRole, MenuChild[]> = {
  supplier: [
    { path: '/stations/my', label: '我的回收站' },
    { path: '/stations/card', label: '数字名片' },
  ],
  buyer: [
    { path: '/stations', label: '回收站列表' },
  ],
  operator: [
    { path: '/stations', label: '回收站列表' },
  ],
};

const allianceChildrenByRole: Record<UserRole, MenuChild[]> = {
  supplier: [],
  buyer: [],
  operator: [
    { path: '/alliance', label: '联盟首页' },
    { path: '/alliance/structure', label: '组织架构' },
    { path: '/alliance/tasks', label: '任务管理' },
    { path: '/alliance/settlement', label: '结算分账' },
  ],
};

const menuItems: MenuItem[] = [
  {
    key: 'workspace',
    path: '/workspace',
    label: '工作台',
    icon: LayoutDashboard,
    roles: ['supplier', 'buyer', 'operator'],
    children: [],
    childrenByRole: workspaceChildrenByRole,
  },
  { 
    key: 'market',
    path: '/market', 
    label: '行情看板', 
    icon: TrendingUp,
    roles: ['supplier', 'buyer', 'operator', 'guest'],
    children: [
      { path: '/market', label: '实时行情' },
      { path: '/market/heatmap', label: '区域价差' },
      { path: '/market/trend', label: '历史走势' },
      { path: '/market/alert', label: '价格预警' },
    ]
  },
  { 
    key: 'supplies',
    path: '/supplies', 
    label: '货源交易', 
    icon: Package,
    roles: ['supplier', 'buyer', 'operator', 'guest'],
    children: [
      { path: '/supplies', label: '货源列表' },
      { path: '/supplies/publish', label: '发布货源' },
    ],
    labelByRole: suppliesLabelByRole,
    childrenByRole: suppliesChildrenByRole,
  },
  { 
    key: 'stations',
    path: '/stations', 
    label: '回收站', 
    icon: Building2,
    roles: ['supplier', 'buyer', 'operator', 'guest'],
    children: [
      { path: '/stations', label: '回收站列表' },
    ],
    labelByRole: stationsLabelByRole,
    childrenByRole: stationsChildrenByRole,
  },
  { 
    key: 'alliance',
    path: '/alliance', 
    label: '联盟管理', 
    icon: Users,
    roles: ['operator'],
    children: [
      { path: '/alliance', label: '联盟首页' },
      { path: '/alliance/structure', label: '组织架构' },
      { path: '/alliance/tasks', label: '任务管理' },
      { path: '/alliance/settlement', label: '结算分账' },
    ],
    childrenByRole: allianceChildrenByRole,
  },
  { 
    key: 'dashboard',
    path: '/dashboard', 
    label: '数据看板', 
    icon: BarChart3,
    roles: ['supplier', 'buyer', 'operator', 'guest'],
    children: [
      { path: '/dashboard', label: '综合概览' },
      { path: '/dashboard/supply-demand', label: '供需分析' },
      { path: '/dashboard/funnel', label: '转化漏斗' },
    ]
  },
];

interface QuickAction {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickActionsByRole: Record<UserRole | 'guest', QuickAction[]> = {
  supplier: [
    { to: '/supplies/publish', label: '发布货源', icon: PlusCircle },
    { to: '/workspace/inquiries', label: '待处理询价', icon: ClipboardList },
  ],
  buyer: [
    { to: '/supplies', label: '货源市场', icon: Search },
    { to: '/supplies/inquiries/new', label: '发起询价', icon: FileText },
  ],
  operator: [
    { to: '/alliance/tasks/assign', label: '派发任务', icon: ListTodo },
    { to: '/alliance/settlement/approve', label: '结算审核', icon: CreditCard },
  ],
  guest: [
    { to: '/market', label: '查看行情', icon: TrendingUp },
    { to: '/supplies', label: '搜索货源', icon: Search },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const currentRole: UserRole | 'guest' = isAuthenticated && user?.role ? user.role : 'guest';
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/market', '/supplies']);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isMenuActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getMenuLabel = (item: MenuItem): string => {
    if (item.labelByRole && currentRole !== 'guest' && item.labelByRole[currentRole]) {
      return item.labelByRole[currentRole];
    }
    return item.label;
  };

  const getMenuChildren = (item: MenuItem): MenuChild[] => {
    if (item.childrenByRole && currentRole !== 'guest' && item.childrenByRole[currentRole]) {
      return item.childrenByRole[currentRole];
    }
    return item.children;
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(currentRole)
  );

  const visibleMenuItems = filteredMenuItems.filter(item => {
    const children = getMenuChildren(item);
    return children.length > 0;
  });

  const quickActions = quickActionsByRole[currentRole];

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
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const label = getMenuLabel(item);
            const children = getMenuChildren(item);
            const active = isMenuActive(item.path);
            const expanded = expandedMenus.includes(item.path);

            return (
              <li key={item.key}>
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
                      <span className="ml-3 font-medium flex-1 text-left">{label}</span>
                      {children && children.length > 0 && (
                        <ChevronDown className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          expanded && 'rotate-180'
                        )} />
                      )}
                    </>
                  )}
                </button>
                
                {!collapsed && expanded && children && children.length > 0 && (
                  <ul className="mt-1 ml-6 space-y-1">
                    {children.map((child) => (
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
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <NavLink 
                    key={action.to}
                    to={action.to} 
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <ActionIcon className="w-3 h-3" />
                    {action.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
