import request from './index'
import type { User, LoginResult, ApiResponse } from '@/types'

export interface LoginParams {
  username: string;
  password: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
  phoneNumber?: string;
  department?: string;
  description?: string;
}

export const authApi = {
  login: (params: LoginParams) => {
    return request.post<ApiResponse<LoginResult>>('/auth/login', params)
  },

  register: (params: CreateUserParams) => {
    return request.post<ApiResponse<User>>('/auth/register', params)
  },

  getProfile: () => {
    return request.get<ApiResponse<User>>('/auth/profile')
  },
}
