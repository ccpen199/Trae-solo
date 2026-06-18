import { post, get, put } from '../api';
import type { LoginRequest, LoginResponse, User } from '../../../shared/types';

export async function login(data: LoginRequest) {
  return post<LoginResponse>('/auth/login', data);
}

export async function refreshToken() {
  return post<{ token: string }>('/auth/refresh');
}

export async function getProfile() {
  return get<User>('/users/profile');
}

export async function updateProfile(data: Partial<User>) {
  return put<User>('/users/profile', data);
}
