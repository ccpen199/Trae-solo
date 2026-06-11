export const getToken = () => localStorage.getItem('token');

export const setToken = (token) => localStorage.setItem('token', token);

export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export const removeUser = () => localStorage.removeItem('user');

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};

export const hasRole = (role) => {
  const user = getUser();
  return user && user.role === role;
};

export const isAdmin = () => hasRole('admin') || hasRole('manager');

export const isMerchant = () => hasRole('merchant');

export const isCouple = () => hasRole('couple');

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};
