import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequired } from '../../../common/decorators/roles.decorator';
import { PermissionType } from '../../role/entities/role-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequired>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      return false;
    }

    return this.checkPermissions(user.roles, requiredPermissions);
  }

  private checkPermissions(userRoles: any[], required: PermissionRequired): boolean {
    for (const role of userRoles) {
      const rolePermissions = role.rolePermissions || [];
      for (const rp of rolePermissions) {
        if (rp.module.code === required.moduleCode) {
          const hasAllRequired = required.permissions.every((p) =>
            rp.permissions.includes(p) || rp.permissions.includes(PermissionType.ALL));
          if (hasAllRequired) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
