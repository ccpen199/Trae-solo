import type { UserRole, User } from '@/types/entity';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  COMMUNITY_ADMIN: 80,
  PROPERTY_STAFF: 60,
  FINANCE_STAFF: 50,
  SECURITY_STAFF: 40,
  RESIDENT: 10,
};

export const hasRole = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) {
    return false;
  }
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const hasAnyRole = (
  userRole: UserRole | undefined, roles: UserRole[]): boolean => {
  if (!userRole) {
    return false;
  }
  return roles.includes(userRole);
};

export const hasPermission = (user: User | null | undefined, permission: string): boolean => {
  if (!user) {
    return false;
  }
  const rolePermissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: [
      'dashboard:view',
      'community:manage',
      'work-order:all',
      'user:manage',
      'bill:all',
      'activity:all',
      'mall:manage',
      'finance:manage',
      'health:all',
      'settings:manage',
    ],
    COMMUNITY_ADMIN: [
      'dashboard:view',
      'community:view',
      'work-order:manage',
      'user:view',
      'bill:view',
      'bill:manage',
      'activity:manage',
      'health:view',
    ],
    PROPERTY_STAFF: [
      'dashboard:view',
      'work-order:view',
      'work-order:handle',
      'activity:view',
    ],
    FINANCE_STAFF: [
      'dashboard:view',
      'bill:view',
      'bill:manage',
      'mall:view-orders',
      'finance:view',
      'finance:manage',
    ],
    SECURITY_STAFF: [
      'dashboard:view',
      'user:view',
      'activity:view',
    ],
    RESIDENT: [
      'dashboard:view',
      'work-order:submit',
      'work-order:view-own',
      'bill:view-own',
      'activity:view',
      'activity:join',
      'mall:view',
      'mall:order',
      'finance:view',
      'health:view-own',
    ],
  };

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
};

export const isSuperAdmin = (role: UserRole | undefined): boolean => {
  return role === 'SUPER_ADMIN';
};

export const isAdmin = (role: UserRole | undefined): boolean => {
  return role === 'SUPER_ADMIN' || role === 'COMMUNITY_ADMIN';
};

export const isStaff = (role: UserRole | undefined): boolean => {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'COMMUNITY_ADMIN' ||
    role === 'PROPERTY_STAFF' ||
    role === 'FINANCE_STAFF' ||
    role === 'SECURITY_STAFF'
  );
};

export const isResident = (role: UserRole | undefined): boolean => {
  return role === 'RESIDENT';
};
