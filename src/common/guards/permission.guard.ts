import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRES_PERMISSION_KEY,
  PermissionOption,
} from '../decorators/requires-permission.decorator';

interface JwtPayload {
  sub: string;
  username?: string;
  permissions?: string[];
  roles?: string[];
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionOption = this.reflector.getAllAndOverride<PermissionOption>(
      REQUIRES_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionOption || permissionOption.permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const userPermissions = user.permissions || [];
    const { permissions: requiredPermissions, logical = 'OR' } = permissionOption;

    let hasPermission = false;

    if (logical === 'AND') {
      hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );
    } else {
      hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm),
      );
    }

    if (!hasPermission) {
      throw new ForbiddenException('权限不足，无法执行此操作');
    }

    return true;
  }
}
