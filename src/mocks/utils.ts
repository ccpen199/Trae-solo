import type { ApiResponse } from '@/types/api';

export const mockDelay = (): Promise<void> => {
  const delay = Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export const mockSuccess = <T>(data: T): ApiResponse<T> => ({
  code: 0,
  message: 'success',
  data,
  success: true,
});

export const mockError = (message: string, code = -1): ApiResponse<null> => ({
  code,
  message,
  data: null,
  success: false,
});

export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
};
