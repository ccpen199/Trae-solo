import apiClient from './apiClient';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

export const authService = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', data);
  },

  sendSms: (phone: string): Promise<{ success: boolean }> => {
    return apiClient.post('/auth/sms', { phone });
  },

  logout: (): Promise<void> => {
    return apiClient.post('/auth/logout');
  },

  getCurrentUser: (): Promise<User> => {
    return apiClient.get('/auth/me');
  },
};
