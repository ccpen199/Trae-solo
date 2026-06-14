import { get, post, put } from '../request';
import type { ApiResponse } from '../request';
import type { UserInfo } from '../../stores/useUserStore';
import type { RoutePermission, ButtonPermission } from '../../stores/usePermissionStore';

export interface CaptchaData {
  captchaId: string;
  captchaImage: string;
  expiresIn: number;
}

export interface SendSmsParams {
  phone: string;
  type: 'login' | 'register' | 'reset_password';
  captchaId?: string;
  captcha?: string;
}

export interface SmsData {
  smsId: string;
  expiresIn: number;
}

export interface LoginParams {
  username: string;
  password: string;
  captchaId: string;
  captcha: string;
  smsCode: string;
  phone: string;
}

export interface LastLoginInfo {
  time: string;
  ip: string;
  location: string;
  device: string;
}

export interface LoginData {
  token: string;
  userInfo: UserInfo;
  lastLogin: LastLoginInfo | null;
}

export interface LoginLogData {
  id: string;
  userId: string;
  username: string;
  ip: string;
  location: string;
  device: string;
  loginTime: string;
  status: 'success' | 'failed';
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PermissionData {
  routes: RoutePermission[];
  buttons: ButtonPermission[];
}

export const getCaptcha = (): Promise<ApiResponse<CaptchaData>> => {
  return post<CaptchaData>('/auth/captcha');
};

export const sendSms = (params: SendSmsParams): Promise<ApiResponse<SmsData>> => {
  return post<SmsData>('/auth/sms/send', params);
};

export const login = (params: LoginParams): Promise<ApiResponse<LoginData>> => {
  return post<LoginData>('/auth/login', params);
};

export const logout = (): Promise<ApiResponse<null>> => {
  return post<null>('/auth/logout');
};

export const recordLoginLog = (): Promise<ApiResponse<null>> => {
  return post<null>('/auth/login/log');
};

export const changePassword = (params: ChangePasswordParams): Promise<ApiResponse<null>> => {
  return put<null>('/auth/password', params);
};

export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return get<UserInfo>('/auth/userinfo');
};

export const getPermissions = (): Promise<ApiResponse<PermissionData>> => {
  return get<PermissionData>('/auth/permissions');
};

export interface UpdateProfileParams {
  realName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface LoginHistoryItem {
  id: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  loginTime: string;
  status: 'success' | 'failed';
}

export const updateProfile = (params: UpdateProfileParams): Promise<ApiResponse<null>> => {
  return put<null>('/auth/profile', params);
};

export const getLoginHistory = (params?: { limit?: number }): Promise<ApiResponse<LoginHistoryItem[]>> => {
  return get<LoginHistoryItem[]>('/auth/login-history', params);
};
