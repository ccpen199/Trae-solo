import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators';
import type { User } from '@pet/shared';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('请先登录');
    }

    const userPermissions = this.getUserPermissions(user);

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (hasPermission) {
      return true;
    }

    throw new ForbiddenException('权限不足，无法访问该资源');
  }

  private getUserPermissions(user: User): string[] {
    const permissions: string[] = [];
    const role = user.role;

    if (role === 'super_admin') {
      permissions.push('*');
    } else if (role === 'admin') {
      permissions.push(
        'user:view',
        'user:manage',
        'product:view',
        'product:audit',
        'order:view',
        'order:manage',
        'content:audit',
        'merchant:view',
        'merchant:audit',
        'doctor:view',
        'doctor:audit',
        'analytics:view',
      );
    } else if (role === 'merchant') {
      permissions.push(
        'product:view',
        'product:create',
        'product:edit',
        'product:delete',
        'order:view',
        'order:ship',
        'store:view',
        'store:edit',
      );
    } else if (role === 'doctor') {
      permissions.push(
        'consultation:view',
        'consultation:respond',
        'pet:view',
        'profile:edit',
      );
    } else {
      permissions.push(
        'profile:view',
        'profile:edit',
        'pet:view',
        'pet:create',
        'pet:edit',
        'pet:delete',
        'order:view',
        'order:create',
      );
    }

    return permissions;
  }
}
