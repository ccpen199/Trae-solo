import request from './axios';
import { ApiResponse, User, EnterpriseType } from '@/types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    status: string;
    realName?: string;
    phone?: string;
    email?: string;
    enterprise?: {
      id: string;
      enterpriseCode: string;
      enterpriseName: string;
      enterpriseType: EnterpriseType;
    } | null;
  };
}

export interface RegisterParams {
  username: string;
  password: string;
  enterpriseCode: string;
  enterpriseName: string;
  enterpriseType: EnterpriseType;
  realName?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
}

export interface UpdateProfileParams {
  realName?: string;
  phone?: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
}

export const authApi = {
  login: (params: LoginParams): Promise<ApiResponse<LoginResult>> => {
    return request.post('/auth/login', params);
  },

  register: (params: RegisterParams): Promise<ApiResponse> => {
    return request.post('/auth/register', params);
  },

  getCurrentUser: (): Promise<ApiResponse<{
    id: string;
    username: string;
    role: string;
    status: string;
    realName?: string;
    phone?: string;
    email?: string;
    enterprise?: {
      id: string;
      enterpriseCode: string;
      enterpriseName: string;
      enterpriseType: EnterpriseType;
    } | null;
  }>> => {
    return request.get('/auth/me');
  },

  updateProfile: (params: UpdateProfileParams): Promise<ApiResponse> => {
    return request.put('/auth/profile', params);
  },

  logout: (): Promise<ApiResponse> => {
    return request.post('/auth/logout');
  },
};
