export interface User {
  id: string;
  account: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const UserStatusText: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '正常',
  [UserStatus.INACTIVE]: '未激活',
  [UserStatus.SUSPENDED]: '已禁用',
};

export enum RoleCode {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const RoleText: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: '管理员',
  [RoleCode.USER]: '普通用户',
};

export interface Role {
  id: string;
  name: string;
  code: RoleCode;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  account: string;
  password: string;
  nickname: string;
  email?: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  account: string;
  password: string;
  nickname: string;
  email?: string;
  phone?: string;
  roleId: string;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  roleId?: string;
  password?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  operation: string;
  module: string;
  targetId: string | null;
  targetType: string | null;
  detail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    account: string;
    nickname: string | null;
  };
}
