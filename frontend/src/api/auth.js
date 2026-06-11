import request from './request';

export const loginApi = (phone, password) => {
  return request.post('/auth/login', { phone, password });
};

export const logoutApi = () => {
  return request.post('/auth/logout', {}, { loading: false });
};

export const getUserInfoApi = () => {
  return request.get('/auth/profile');
};

export const updateProfileApi = (data) => {
  return request.put('/auth/profile', data);
};
