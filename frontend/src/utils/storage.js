const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  return localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  return localStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => {
  return localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  return localStorage.removeItem(USER_KEY);
};

export const clearAll = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
