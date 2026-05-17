import api from './client';

export const register = (data) => {
  return api.post('/users/register', data);
};

export const login = (data) => {
  return api.post('/users/login', data);
};

export const getProfile = () => {
  return api.get('/users/profile');
};

export const updateProfile = (data) => {
  return api.put('/users/profile', data);
};

export const adminLogin = (data) => {
  return api.post('/admin/login', data);
};
