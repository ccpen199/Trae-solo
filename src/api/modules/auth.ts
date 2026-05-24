import request from '../request';
import type { LoginRequest, LoginResponse, User } from '../../types';

export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/auth/login', data);
};

export const getProfile = (): Promise<User> => {
  return request.get('/auth/profile');
};
