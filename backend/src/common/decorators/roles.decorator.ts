import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../../modules/role/entities/role-permission.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export interface PermissionRequired {
  moduleCode: string;
  permissions: PermissionType[];
}

export const Permissions = (moduleCode: string, ...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, { moduleCode, permissions });
