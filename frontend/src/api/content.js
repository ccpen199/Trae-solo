import api from './client';

export const getContents = (params) => {
  return api.get('/content', { params });
};

export const getContent = (id) => {
  return api.get(`/content/${id}`);
};

export const interactContent = (id, data) => {
  return api.post(`/content/${id}/interaction`, data);
};

export const getRecommended = () => {
  return api.get('/content/recommended');
};
