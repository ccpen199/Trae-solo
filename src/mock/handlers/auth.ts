import { http, HttpResponse } from 'msw';
import { mockUser, mockStoreUser, mockVeterinarian } from '../fixtures/auth';
import { successResponse, delay } from '../utils';
import type { LoginRequest } from '@/types/auth';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as LoginRequest;
    
    let user = mockUser;
    if (body.role === 'store_admin') {
      user = mockStoreUser;
    } else if (body.role === 'veterinarian') {
      user = mockVeterinarian;
    }

    const token = `mock_token_${Date.now()}`;
    localStorage.setItem('auth_token', token);
    
    return HttpResponse.json(
      successResponse({
        token,
        user,
      })
    );
  }),

  http.post('/api/auth/sms', async () => {
    await delay(300);
    return HttpResponse.json(successResponse({ success: true }, '验证码已发送'));
  }),

  http.post('/api/auth/logout', async () => {
    await delay(200);
    localStorage.removeItem('auth_token');
    return HttpResponse.json(successResponse(null, '已退出登录'));
  }),

  http.get('/api/auth/me', async () => {
    await delay(300);
    return HttpResponse.json(successResponse(mockUser));
  }),
];
