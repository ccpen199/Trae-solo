import { post } from './http';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export const authService = {
  login(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    return post('/auth/admin-login', data);
  },
};
