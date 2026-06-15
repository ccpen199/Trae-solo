import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PERMISSION_KEY = 'requires_permission';

export interface PermissionOption {
  permissions: string[];
  logical?: 'AND' | 'OR';
}

export const RequiresPermission = (
  permissions: string | string[],
  logical: 'AND' | 'OR' = 'OR',
): ReturnType<typeof SetMetadata> => {
  const perms = Array.isArray(permissions) ? permissions : [permissions];
  return SetMetadata<string, PermissionOption>(REQUIRES_PERMISSION_KEY, {
    permissions: perms,
    logical,
  });
};
