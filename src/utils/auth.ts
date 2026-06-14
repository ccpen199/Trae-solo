import type { UserRole } from '@/types';

export const roleNames: Record<UserRole, string> = {
  resident: '居民',
  property: '物业',
  committee: '业委会'
};

export const roleDescriptions: Record<UserRole, string> = {
  resident: '报修、门禁、生活服务',
  property: '工单处理、设备监控、KPI',
  committee: '公共事务、监督物业'
};

export const hasPermission = (role: UserRole, feature: string): boolean => {
  const permissions: Record<UserRole, Set<string>> = {
    resident: new Set(['access', 'ticket', 'service', 'order', 'property', 'visitor']),
    property: new Set(['access', 'ticket', 'service', 'kpi', 'devices', 'provider', 'announcement']),
    committee: new Set(['access', 'ticket', 'kpi', 'announcement', 'vote'])
  };
  return permissions[role]?.has(feature) ?? false;
};
