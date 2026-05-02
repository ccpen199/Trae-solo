import { api } from './index'
import type { User, LoginResult } from '@/types'

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
    return api.post<LoginResult>('/auth/login', params)
  },

  register: (params: CreateUserParams) => {
    return api.post<User>('/auth/register', params)
  },

  getProfile: () => {
    return api.get<User>('/auth/profile')
  },
}
