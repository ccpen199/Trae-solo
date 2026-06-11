import request from './request';

export const getRecommendPolicies = (params) => {
  return request.get('/home/policies/recommend', { params });
};

export const getHotServices = () => {
  return request.get('/home/services/hot');
};

export const getTodos = () => {
  return request.get('/home/todos');
};

export const getBanners = () => {
  return request.get('/home/banner', { loading: false });
};

export const getProvinces = () => {
  return request.get('/home/provinces', { loading: false });
};

export const setProvince = (province, city) => {
  return request.post('/home/province/set', { province, city });
};
