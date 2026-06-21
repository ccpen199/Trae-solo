import { get, post, put } from './request';
import { User, LoginParams, LoginResponse, PaginationResult, PaginationParams } from '@/types';

export const userApi = {
  login: (params: LoginParams): Promise<LoginResponse> => {
    return post<LoginResponse>('/auth/login', params);
  },

  logout: (): Promise<void> => {
    return post('/auth/logout');
  },

  sendSmsCode: (phone: string): Promise<void> => {
    return post('/auth/send-code', { phone });
  },

  getCurrentUser: (): Promise<User> => {
    return get<User>('/user/me');
  },

  updateProfile: (data: Partial<User>): Promise<User> => {
    return put<User>('/user/profile', data);
  },

  verifyLicense: (data: { licenseNumber: string; licenseImage: string }): Promise<User> => {
    return post<User>('/user/verify-license', data);
  },

  getUserList: (params: PaginationParams & { keyword?: string; role?: string }): Promise<PaginationResult<User>> => {
    return get<PaginationResult<User>>('/users', { params });
  },

  getUserDetail: (id: string): Promise<User> => {
    return get<User>(`/users/${id}`);
  },
};
