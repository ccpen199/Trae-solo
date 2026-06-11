import { http } from '../utils/request';
import type { User, UserRole, ApiResponse } from '../../shared/types';

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  phone: string;
  role: UserRole;
  companyName?: string;
}

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return http.post<ApiResponse<LoginResponse>>('/auth/login', data);
  },

  register: (data: RegisterRequest): Promise<ApiResponse<User>> => {
    return http.post<ApiResponse<User>>('/auth/register', data);
  },

  logout: (): Promise<ApiResponse<null>> => {
    return http.post<ApiResponse<null>>('/auth/logout');
  },

  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return http.get<ApiResponse<User>>('/auth/me');
  },

  refreshToken: (): Promise<ApiResponse<{ token: string }>> => {
    return http.post<ApiResponse<{ token: string }>>('/auth/refresh');
  },

  sendSmsCode: (phone: string): Promise<ApiResponse<{ expiredAt: number }>> => {
    return http.post<ApiResponse<{ expiredAt: number }>>('/auth/sms-code', { phone });
  },

  loginBySms: (data: {
    phone: string;
    code: string;
    role: UserRole;
  }): Promise<ApiResponse<LoginResponse>> => {
    return http.post<ApiResponse<LoginResponse>>('/auth/login-sms', data);
  },

  resetPassword: (data: {
    phone: string;
    code: string;
    newPassword: string;
  }): Promise<ApiResponse<null>> => {
    return http.post<ApiResponse<null>>('/auth/reset-password', data);
  },

  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<null>> => {
    return http.post<ApiResponse<null>>('/auth/change-password', data);
  },
};

export default authApi;
