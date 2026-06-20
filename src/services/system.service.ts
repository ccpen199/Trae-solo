import type { ApiResponse } from '@/types/api';
import type { UserRole } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockRoles, mockPermissions } from '@/mocks/data/users';

export interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
}

export const getRoleList = async (): Promise<ApiResponse<UserRole[]>> => {
  await mockDelay();
  return mockSuccess(mockRoles);
};

export const getPermissionList = async (): Promise<ApiResponse<Permission[]>> => {
  await mockDelay();
  return mockSuccess(mockPermissions as Permission[]);
};
