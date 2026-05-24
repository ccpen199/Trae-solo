import request from '../request';
import type { User } from '../../types';

interface GetUsersParams {
  role?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const getUsers = (params?: GetUsersParams): Promise<User[]> => {
  return request.get('/users', { params });
};

export const createUser = (data: Partial<User> & { password: string }): Promise<User> => {
  return request.post('/users', data);
};

export const updateUser = (id: number, data: Partial<User>): Promise<User> => {
  return request.put(`/users/${id}`, data);
};

export const updateUserStatus = (id: number, status: 'active' | 'disabled'): Promise<User> => {
  return request.patch(`/users/${id}/status`, { status });
};
