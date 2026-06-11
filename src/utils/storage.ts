const TOKEN_KEY = 'az_token';
const USER_KEY = 'az_user_info';
const ADMIN_TOKEN_KEY = 'az_admin_token';
const ADMIN_USER_KEY = 'az_admin_user';

export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: (): any => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  getAdminToken: (): string | null => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  setAdminToken: (token: string): void => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  removeAdminToken: (): void => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  getAdminUser: (): any => {
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  setAdminUser: (user: any): void => {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  },
  removeAdminUser: (): void => {
    localStorage.removeItem(ADMIN_USER_KEY);
  },

  clearAll: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  clearAdminAll: (): void => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },
};
