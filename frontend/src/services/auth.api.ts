import { http } from './request';
import type { User, UserRole } from '../types';

export interface LoginParams {
  phone: string;
  password: string;
  role?: UserRole;
}

export interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login(params: LoginParams): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/login', params);
  },

  register(params: RegisterParams): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/register', params);
  },

  getMe(): Promise<User> {
    return http.get<User>('/auth/me');
  },

  logout(): Promise<void> {
    return http.post<void>('/auth/logout');
  },
};
