export const PROPERTY_TYPE_MAP: Record<string, string> = {
  shared_rent: '分散式合租',
  whole_rent: '整租',
  apartment: '集中式公寓',
  second_hand: '二手房'
};

export const PROPERTY_STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  active: '上架中',
  contracted: '已签约',
  sold: '已售出',
  rented: '已出租',
  offline: '已下架'
};

export const PROPERTY_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  contracted: 'bg-blue-100 text-blue-700',
  sold: 'bg-purple-100 text-purple-700',
  rented: 'bg-accent-100 text-accent-700',
  offline: 'bg-red-100 text-red-700'
};

export const DECORATION_MAP: Record<string, string> = {
  rough: '毛坯',
  simple: '简装',
  medium: '中装',
  luxury: '豪装'
};

export const WO_TYPE_MAP: Record<string, string> = {
  cleaning: '保洁',
  repair: '维修',
  moving: '搬家',
  renovation: '装修'
};

export const WO_TYPE_COLOR: Record<string, string> = {
  cleaning: 'bg-cyan-100 text-cyan-700',
  repair: 'bg-orange-100 text-orange-700',
  moving: 'bg-indigo-100 text-indigo-700',
  renovation: 'bg-rose-100 text-rose-700'
};

export const WO_STATUS_MAP: Record<string, string> = {
  pending: '待指派',
  assigned: '已指派',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消'
};

export const WO_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export const WO_PRIORITY_MAP: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
};

export const WO_PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export const TRANSACTION_STATUS_MAP: Record<string, string> = {
  negotiating: '洽谈中',
  contracted: '已签约',
  funded: '资金已存',
  transferring: '过户中',
  completed: '已完成',
  cancelled: '已取消'
};

export const TRANSACTION_STATUS_COLOR: Record<string, string> = {
  negotiating: 'bg-gray-100 text-gray-700',
  contracted: 'bg-blue-100 text-blue-700',
  funded: 'bg-indigo-100 text-indigo-700',
  transferring: 'bg-accent-100 text-accent-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export const LEASE_STATUS_MAP: Record<string, string> = {
  active: '履行中',
  expired: '已到期',
  terminated: '已终止',
  renewed: '已续约'
};

export const LEASE_STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-700',
  terminated: 'bg-red-100 text-red-700',
  renewed: 'bg-blue-100 text-blue-700'
};

export const USER_ROLE_MAP: Record<string, string> = {
  tenant: '租客',
  buyer: '买家',
  owner: '业主',
  agent_self: '自营经纪人',
  agent_franchise: '加盟经纪人',
  admin: '系统管理员'
};

export const CONTRACT_STATUS_MAP: Record<string, string> = {
  pending: '待签约',
  signed: '已签约',
  archived: '已归档'
};

export const CONTRACT_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  signed: 'bg-green-100 text-green-700',
  archived: 'bg-blue-100 text-blue-700'
};

export const CONTRACT_TEMPLATE_MAP: Record<string, string> = {
  rent_commission: '出租委托合同',
  sale_commission: '出售委托合同',
  lease: '租赁合同'
};

export const DEPOSIT_STATUS_MAP: Record<string, string> = {
  held: '托管中',
  partial_refund: '部分退还',
  refunded: '已退还',
  deducted: '已扣除'
};

export const DEPOSIT_STATUS_COLOR: Record<string, string> = {
  held: 'bg-green-100 text-green-700',
  partial_refund: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
  deducted: 'bg-red-100 text-red-700'
};

export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '-';
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + ' 万';
  }
  return amount.toLocaleString() + ' 元';
}

export const SUPPLIER_TYPE_MAP: Record<string, string> = {
  material: '装修建材',
  housekeeping: '家政服务',
  moving: '搬家服务',
  renovation: '装修公司'
};

export const SUPPLIER_STATUS_MAP: Record<string, string> = {
  active: '合作中',
  suspended: '暂停',
  terminated: '终止'
};

export const SUPPLIER_STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700'
};

export function formatPrice(price: number, type?: string): string {
  if (!type || type === 'second_hand') {
    if (price >= 10000) {
      return (price / 10000).toFixed(2) + ' 万';
    }
    return price.toLocaleString() + ' 元';
  }
  return price.toLocaleString() + ' 元/月';
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return dateStr as string;
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return dateStr as string;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['all'],
  agent_self: ['dashboard', 'properties', 'properties_new', 'transactions', 'leases', 'work_orders'],
  agent_franchise: ['dashboard', 'properties', 'properties_new', 'transactions', 'leases', 'work_orders'],
  owner: ['dashboard', 'properties', 'leases', 'work_orders'],
  tenant: ['dashboard', 'properties', 'work_orders'],
  buyer: ['dashboard', 'properties', 'transactions'],
};

interface MenuItem {
  path: string;
  name: string;
  icon: string;
  permission: string;
  roles?: string[];
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const MENU_ITEMS: MenuGroup[] = [
  {
    group: '工作台',
    items: [
      { path: '/', name: '工作台首页', icon: 'Home', permission: 'dashboard' },
    ]
  },
  {
    group: '房源管理',
    items: [
      { path: '/properties', name: '房源列表', icon: 'Building2', permission: 'properties' },
      { path: '/properties/new', name: '新增房源', icon: 'PlusCircle', permission: 'properties_new', roles: ['admin', 'agent_self', 'agent_franchise'] },
    ]
  },
  {
    group: '交易管理',
    items: [
      { path: '/transactions', name: '买卖交易', icon: 'FileSignature', permission: 'transactions' },
    ]
  },
  {
    group: '租务管理',
    items: [
      { path: '/leases', name: '租约管理', icon: 'KeyRound', permission: 'leases' },
    ]
  },
  {
    group: '服务工单',
    items: [
      { path: '/work-orders', name: '工单列表', icon: 'ClipboardList', permission: 'work_orders' },
    ]
  },
  {
    group: '后台管理',
    items: [
      { path: '/dashboard/agents', name: '经纪人业绩', icon: 'TrendingUp', permission: 'agents_dashboard', roles: ['admin'] },
      { path: '/dashboard/property-health', name: '房源健康度', icon: 'Activity', permission: 'property_health', roles: ['admin', 'agent_self', 'agent_franchise'] },
      { path: '/dashboard/supply-chain', name: '供应链协同', icon: 'Users', permission: 'supply_chain', roles: ['admin'] },
    ]
  },
  {
    group: '系统',
    items: [
      { path: '/settings', name: '系统设置', icon: 'Settings', permission: 'settings', roles: ['admin'] },
    ]
  }
];

export function hasPermission(userRole: string | undefined, permission: string, allowedRoles?: string[]): boolean {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  if (allowedRoles && !allowedRoles.includes(userRole)) return false;
  const perms = ROLE_PERMISSIONS[userRole] || [];
  return perms.includes(permission) || perms.includes('all');
}
