export type PermissionKey =
  | 'dashboard:view'
  | 'task:view'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:roi'
  | 'user:view'
  | 'user:block'
  | 'user:cheater'
  | 'user:ltv'
  | 'withdrawal:view'
  | 'withdrawal:audit'
  | 'risk:view'
  | 'risk:handle'
  | 'ad:view'
  | 'ad:create'
  | 'ad:edit'
  | 'ad:delete'
  | 'admin:super';

export type AdminRole = 'super' | 'admin' | 'operator' | 'auditor' | 'viewer';

export const PERMISSIONS: Record<PermissionKey, { label: string; module: string }> = {
  'dashboard:view': { label: '查看数据看板', module: '数据看板' },
  'task:view': { label: '查看任务', module: '任务管理' },
  'task:create': { label: '创建任务', module: '任务管理' },
  'task:edit': { label: '编辑任务', module: '任务管理' },
  'task:delete': { label: '删除任务', module: '任务管理' },
  'task:roi': { label: '查看ROI分析', module: '任务管理' },
  'user:view': { label: '查看用户', module: '用户管理' },
  'user:block': { label: '封禁/解封用户', module: '用户管理' },
  'user:cheater': { label: '标记作弊用户', module: '用户管理' },
  'user:ltv': { label: '查看LTV预测', module: '用户管理' },
  'withdrawal:view': { label: '查看提现记录', module: '提现审核' },
  'withdrawal:audit': { label: '审核提现', module: '提现审核' },
  'risk:view': { label: '查看风控事件', module: '风控中心' },
  'risk:handle': { label: '处理风控事件', module: '风控中心' },
  'ad:view': { label: '查看广告配置', module: '广告配置' },
  'ad:create': { label: '创建广告位', module: '广告配置' },
  'ad:edit': { label: '编辑广告位', module: '广告配置' },
  'ad:delete': { label: '删除广告位', module: '广告配置' },
  'admin:super': { label: '超级管理员', module: '系统' },
};

export const ROLE_PERMISSIONS: Record<AdminRole, PermissionKey[]> = {
  super: Object.keys(PERMISSIONS) as PermissionKey[],
  admin: [
    'dashboard:view',
    'task:view', 'task:create', 'task:edit', 'task:roi',
    'user:view', 'user:block', 'user:cheater', 'user:ltv',
    'withdrawal:view', 'withdrawal:audit',
    'risk:view', 'risk:handle',
    'ad:view', 'ad:create', 'ad:edit', 'ad:delete',
  ],
  operator: [
    'dashboard:view',
    'task:view', 'task:create', 'task:edit',
    'user:view',
    'withdrawal:view',
    'risk:view',
    'ad:view',
  ],
  auditor: [
    'dashboard:view',
    'user:view',
    'withdrawal:view', 'withdrawal:audit',
    'risk:view',
  ],
  viewer: [
    'dashboard:view',
    'task:view', 'task:roi',
    'user:view',
    'withdrawal:view',
    'risk:view',
    'ad:view',
  ],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super: '超级管理员',
  admin: '管理员',
  operator: '运营人员',
  auditor: '审核员',
  viewer: '只读用户',
};

export function hasPermission(role: AdminRole | string | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  const rolePerms = ROLE_PERMISSIONS[role as AdminRole];
  if (!rolePerms) return false;
  return rolePerms.includes(permission) || rolePerms.includes('admin:super');
}

export function hasAnyPermission(role: AdminRole | string | undefined, permissions: PermissionKey[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}
