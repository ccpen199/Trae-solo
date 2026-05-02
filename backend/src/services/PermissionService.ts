import { UserRole } from '../constants/enums';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { PermissionDeniedError, NotFoundError } from '../errors/AppError';

export type Permission = 
  | 'property:view'
  | 'property:create'
  | 'property:edit'
  | 'property:delete'
  | 'order:view'
  | 'order:create'
  | 'order:edit'
  | 'order:cancel'
  | 'order:refund'
  | 'calendar:view'
  | 'calendar:edit'
  | 'calendar:block'
  | 'cleaning:view'
  | 'cleaning:assign'
  | 'cleaning:complete'
  | 'review:view'
  | 'review:create'
  | 'review:reply'
  | 'report:view'
  | 'report:export'
  | 'channel:sync'
  | 'admin:review'
  | 'admin:approve';

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    'property:view',
    'order:view',
    'order:create',
    'order:cancel',
    'review:view',
    'review:create',
  ],
  [UserRole.LANDLORD]: [
    'property:view',
    'property:create',
    'property:edit',
    'property:delete',
    'order:view',
    'order:edit',
    'order:cancel',
    'order:refund',
    'calendar:view',
    'calendar:edit',
    'calendar:block',
    'cleaning:view',
    'cleaning:assign',
    'review:view',
    'review:reply',
    'report:view',
    'report:export',
    'channel:sync',
  ],
  [UserRole.CLEANER]: [
    'cleaning:view',
    'cleaning:complete',
    'order:view',
  ],
  [UserRole.CHANNEL_PLATFORM]: [
    'property:view',
    'order:view',
    'order:create',
    'order:edit',
    'order:cancel',
    'calendar:view',
    'calendar:edit',
    'channel:sync',
  ],
  [UserRole.ADMIN]: [
    'property:view',
    'property:create',
    'property:edit',
    'property:delete',
    'order:view',
    'order:create',
    'order:edit',
    'order:cancel',
    'order:refund',
    'calendar:view',
    'calendar:edit',
    'calendar:block',
    'cleaning:view',
    'cleaning:assign',
    'cleaning:complete',
    'review:view',
    'review:create',
    'review:reply',
    'report:view',
    'report:export',
    'channel:sync',
    'admin:review',
    'admin:approve',
  ],
};

export interface ResourceOwnerCheck {
  resourceType: string;
  resourceId: string;
  userId: string;
}

export class PermissionService {
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
  }

  checkPermission(role: UserRole, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      logger.warn(`Permission denied: role ${role} does not have ${permission}`);
      throw new PermissionDeniedError();
    }
  }

  async checkPropertyOwner(
    propertyId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    return property.ownerId === userId;
  }

  async checkOrderAccess(
    orderId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { guestId: true, property: { select: { ownerId: true } } },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    if (userRole === UserRole.LANDLORD) {
      return order.property.ownerId === userId;
    }

    if (userRole === UserRole.GUEST) {
      return order.guestId === userId;
    }

    return false;
  }

  async checkCleaningTaskAccess(
    taskId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
      select: { cleanerId: true, property: { select: { ownerId: true } } },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (userRole === UserRole.LANDLORD) {
      return task.property.ownerId === userId;
    }

    if (userRole === UserRole.CLEANER) {
      return task.cleanerId === userId;
    }

    return false;
  }

  async verifyAndThrow(
    condition: boolean,
    message?: string
  ): Promise<void> {
    if (!condition) {
      throw new PermissionDeniedError(message);
    }
  }

  async checkResourceOwner(
    check: ResourceOwnerCheck,
    userRole: UserRole
  ): Promise<boolean> {
    switch (check.resourceType) {
      case 'property':
        return this.checkPropertyOwner(check.resourceId, check.userId, userRole);
      case 'order':
        return this.checkOrderAccess(check.resourceId, check.userId, userRole);
      case 'cleaning':
        return this.checkCleaningTaskAccess(check.resourceId, check.userId, userRole);
      default:
        return userRole === UserRole.ADMIN;
    }
  }
}

export const permissionService = new PermissionService();
export default permissionService;
