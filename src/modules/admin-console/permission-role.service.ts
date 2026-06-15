import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_ADMIN' | 'APPROVER' | 'STAFF' | 'USER';

export interface Permission {
  resource: string;
  actions: string[];
  description?: string;
}

export interface RoleDefinition {
  role: RoleType;
  roleName: string;
  description: string;
  permissions: Permission[];
}

const ROLE_PERMISSIONS: RoleDefinition[] = [
  {
    role: 'SUPER_ADMIN',
    roleName: '超级管理员',
    description: '系统最高权限，可访问所有功能',
    permissions: [
      { resource: '*', actions: ['*'] },
    ],
  },
  {
    role: 'ADMIN',
    roleName: '系统管理员',
    description: '系统管理与配置管理',
    permissions: [
      { resource: 'system', actions: ['manage'] },
      { resource: 'user', actions: ['manage'] },
      { resource: 'policy', actions: ['view', 'create', 'update', 'delete'] },
      { resource: 'serviceItem', actions: ['view', 'create', 'update', 'delete'] },
      { resource: 'application', actions: ['view', 'manage'] },
      { resource: 'statistics', actions: ['view'] },
      { resource: 'audit', actions: ['view'] },
    ],
  },
  {
    role: 'DEPARTMENT_ADMIN',
    roleName: '部门管理员',
    description: '部门级管理员，管理本部门业务',
    permissions: [
      { resource: 'application', actions: ['view', 'approve', 'reject'] },
      { resource: 'serviceItem', actions: ['view'] },
      { resource: 'statistics', actions: ['view'] },
      { resource: 'certificate', actions: ['issue', 'view'] },
    ],
  },
  {
    role: 'APPROVER',
    roleName: '审批人员',
    description: '具有审批权限的工作人员',
    permissions: [
      { resource: 'application', actions: ['view', 'approve'] },
      { resource: 'certificate', actions: ['issue', 'view'] },
    ],
  },
  {
    role: 'STAFF',
    roleName: '办事人员',
    description: '普通工作人员，查看与查询功能',
    permissions: [
      { resource: 'application', actions: ['view'] },
      { resource: 'serviceItem', actions: ['view'] },
    ],
  },
  {
    role: 'USER',
    roleName: '普通用户',
    description: '普通办事群众，仅可访问个人相关信息',
    permissions: [
      { resource: 'my', actions: ['view', 'create', 'update'] },
      { resource: 'certificate', actions: ['view'] },
    ],
  },
];

@Injectable()
export class PermissionRoleService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  getAllRoles(): RoleDefinition[] {
    return ROLE_PERMISSIONS;
  }

  getRoleDefinition(role: RoleType): RoleDefinition | undefined {
    return ROLE_PERMISSIONS.find((r) => r.role === role);
  }

  checkPermission(role: RoleType, resource: string, action: string): boolean {
    const roleDef = this.getRoleDefinition(role);
    if (!roleDef) return false;
    for (const perm of roleDef.permissions) {
      if (perm.resource === '*' || perm.resource === resource) {
        if (perm.actions.includes('*') || perm.actions.includes(action)) {
          return true;
        }
      }
      if (perm.resource.endsWith('*') && resource.startsWith(perm.resource.slice(0, -1))) {
        return true;
      }
    }
    return false;
  }

  async getUserRoles(userId: string): Promise<RoleType[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return ['USER'];

    let roles: RoleType[] = ['USER'];

    if (user.id === 'admin') roles.push('ADMIN');
    if (user.authType?.includes('ADMIN')) roles.push('DEPARTMENT_ADMIN');
    if (user.id === 'super') roles.unshift('SUPER_ADMIN');

    return [...new Set(roles)];
  }

  async getRoleMatrix() {
    return {
      roles: ROLE_PERMISSIONS.map((r) => ({
        role: r.role,
        roleName: r.roleName,
        description: r.description,
        permissionCount: r.permissions.length,
      })),
      resources: [
        { code: 'system', name: '系统管理', description: '系统配置与参数管理' },
        { code: 'user', name: '用户管理', description: '用户与权限管理' },
        { code: 'serviceItem', name: '事项管理', description: '服务事项标准化管理' },
        { code: 'application', name: '办件管理', description: '办件查询与审批' },
        { code: 'certificate', name: '证照管理', description: '电子证照签发与管理' },
        { code: 'policy', name: '政策管理', description: '政策文件管理' },
        { code: 'statistics', name: '统计分析', description: '数据统计与分析报表' },
        { code: 'audit', name: '审计日志', description: '操作审计日志查看' },
        { code: 'my', name: '个人中心', description: '个人相关功能' },
      ],
    };
  }
}
