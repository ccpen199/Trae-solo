import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/entity';
import { mockDelay, mockSuccess, mockError } from '@/mocks/utils';
import { mockUsers } from '@/mocks/data/users';

export const login = async (username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
  await mockDelay();

  const user = mockUsers.find((u) => u.username === username);

  if (!user) {
    return mockError('用户不存在') as unknown as ApiResponse<{ token: string; user: User }>;
  }

  if (password !== '123456') {
    return mockError('密码错误') as unknown as ApiResponse<{ token: string; user: User }>;
  }

  const token = `mock_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem('token', token);
  localStorage.setItem('userInfo', JSON.stringify(user));

  return mockSuccess({ token, user });
};

export const getUserInfo = async (): Promise<ApiResponse<User>> => {
  await mockDelay();

  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) {
    return mockError('未登录') as unknown as ApiResponse<User>;
  }

  try {
    const userInfo = JSON.parse(userInfoStr) as User;
    const user = mockUsers.find((u) => u.id === userInfo.id);
    if (user) {
      return mockSuccess(user);
    }
    return mockError('用户不存在') as unknown as ApiResponse<User>;
  } catch {
    return mockError('用户信息异常') as unknown as ApiResponse<User>;
  }
};

export const logout = async (): Promise<ApiResponse<null>> => {
  await mockDelay();

  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');

  return mockSuccess(null);
};
