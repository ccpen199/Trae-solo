import type { User } from '../../shared/types';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_info';

export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  clearAll: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  get: <T = unknown>(key: string): T | null => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    return null;
  },

  set: <T = unknown>(key: string, value: T): void => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

export default storage;
