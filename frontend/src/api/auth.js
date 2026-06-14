import request from './index';

export const login = (username, password) => {
  return request.post('/user/login', { username, password });
};

export const logout = () => {
  return request.post('/user/logout');
};

export const getProfile = () => {
  return request.get('/user/profile');
};
