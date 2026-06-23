export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  position: string;
  departmentId: string;
  departmentName: string;
  orgLevel: 'province' | 'city' | 'team';
  roles: string[];
  permissions: string[];
  status: 'active' | 'inactive';
  lastLoginTime: string;
  bioAuthEnabled: boolean;
  encryptKey: string;
  orgId: string;
}

export interface LoginParams {
  username: string;
  password: string;
  captcha?: string;
}

export interface LoginResult {
  token: string;
  userInfo: User;
  refreshToken: string;
}

export interface DeviceInfo {
  id: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web';
  lastLoginTime: string;
  ipAddress: string;
  isCurrent: boolean;
  model: string;
  system: string;
  systemVersion: string;
  deviceId: string;
}
