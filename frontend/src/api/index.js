import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const rankingsAPI = {
  getRankings: (type) => {
    return api.get('/rankings', { params: { type } });
  },
  
  getRankingById: (id, sortBy = 'rank') => {
    return api.get(`/rankings/${id}`, { params: { sort_by: sortBy } });
  },
  
  getRankingByType: (type) => {
    return api.get(`/rankings/type/${type}`);
  }
};

export const searchAPI = {
  search: (keyword) => {
    return api.get('/search', { params: { q: keyword } });
  },
  
  getHistory: () => {
    return api.get('/search/history');
  },
  
  clearHistory: () => {
    return api.delete('/search/history');
  }
};

export const productsAPI = {
  getProduct: (id) => {
    return api.get(`/products/${id}`);
  },
  
  getComments: (id, page = 1, limit = 20) => {
    return api.get(`/products/${id}/comments`, { params: { page, limit } });
  },
  
  recommend: (id) => {
    return api.post(`/products/${id}/recommend`);
  }
};

export default api;
