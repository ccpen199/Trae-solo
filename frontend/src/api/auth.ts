import api from './client';
import { User } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const register = async (data: LoginRequest & { name: string; email?: string }): Promise<User> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};
