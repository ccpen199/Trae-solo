import { SharePermission } from '../enums/device.enum';

export interface IUser {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'disabled';
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface IAuthPayload {
  userId: string;
  username: string;
  role: string;
  homeId?: string;
}

export interface IVendorAuthPayload {
  vendorId: string;
  vendorName: string;
  permissions: string[];
}

export interface IAccessToken {
  token: string;
  expiresIn: number;
  refreshToken: string;
}

export interface IPermissionContext {
  userId: string;
  deviceId: string;
  permission: SharePermission;
}
