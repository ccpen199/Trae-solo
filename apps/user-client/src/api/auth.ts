import http from './index';
import type { GstLoginUrlResponse, LoginResponse } from '@shared/types/auth';

export const authApi = {
  getLoginUrl(): Promise<GstLoginUrlResponse> {
    return http.get('/auth/gst/login-url');
  },

  callback(code: string, state: string): Promise<LoginResponse> {
    return http.post('/auth/gst/callback', { code, state });
  },

  refresh(refreshToken: string): Promise<LoginResponse> {
    return http.post('/auth/refresh', { refreshToken });
  },

  logout(): Promise<void> {
    return http.post('/auth/logout');
  },
};
