import api from '../utils/api';

export const newsService = {
  getNews: (params) => {
    return api.get('/news', { params });
  },
  
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },
  
  getRecommendedNews: (limit) => {
    return api.get('/news/recommended', { params: { limit } });
  },
  
  getLatestNews: (params) => {
    return api.get('/news/latest', { params });
  },
  
  getCategories: (params) => {
    return api.get('/news/categories', { params });
  },
  
  getAllCategories: () => {
    return api.get('/news/categories/all');
  },
  
  createNews: (data) => {
    return api.post('/news', data);
  },
  
  updateNews: (id, data) => {
    return api.put(`/news/${id}`, data);
  },
  
  deleteNews: (id) => {
    return api.delete(`/news/${id}`);
  }
};