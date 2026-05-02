import { SetMetadata } from '@nestjs/common';
import { Role } from '@hospital/shared';

export const ROLES_KEY = 'roles';

export type RoleType = Role | string;

export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
