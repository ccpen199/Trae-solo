import request from './http';
import { User, PaginatedResponse } from '@/types';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export const authApi = {
  login(data: LoginData) {
    return request.post<LoginResult>('/auth/login', data);
  },

  getCurrentUser() {
    return request.get<User>('/auth/me');
  },

  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.post('/auth/change-password', data);
  },

  getUsers(params?: { role?: string; search?: string }) {
    return request.get<PaginatedResponse<User>>('/auth/users', { params });
  },
};

export default authApi;
