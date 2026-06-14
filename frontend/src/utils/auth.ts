import type { User } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
  return null;
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUserRole = (): string | null => {
  const user = getUser();
  return user?.role || null;
};

export const isAdmin = (): boolean => {
  return getUserRole() === 'admin';
};

export const isEnterprise = (): boolean => {
  return getUserRole() === 'enterprise';
};

export const isJobseeker = (): boolean => {
  return getUserRole() === 'jobseeker';
};
