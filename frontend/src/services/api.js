import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (login, password) => 
    api.post('/auth/login', { login, password }),
  
  register: (data) => 
    api.post('/auth/register', data),
  
  resetPassword: (email) => 
    api.post('/auth/reset-password', { email }),
  
  getMe: () => 
    api.get('/auth/me'),
};

export const favoriteApi = {
  add: (data) => 
    api.post('/favorites', data),
  
  check: (objectType, objectId) => 
    api.get(`/favorites/check?object_type=${objectType}&object_id=${objectId}`),
  
  getAll: (type = 'all', tag) => {
    let url = `/favorites?type=${type}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    return api.get(url);
  },
  
  getTags: (limit) => {
    let url = '/favorites/tags';
    if (limit) url += `?limit=${limit}`;
    return api.get(url);
  },
  
  updateTags: (id, tags) => 
    api.put(`/favorites/${id}/tags`, { tags }),
  
  delete: (id) => 
    api.delete(`/favorites/${id}`),
  
  batchDelete: (ids) => 
    api.post('/favorites/batch-delete', { ids }),
};

export const productApi = {
  getAll: (params = {}) => 
    api.get('/products', { params }),
  
  getById: (id) => 
    api.get(`/products/${id}`),
};

export const companyApi = {
  getAll: (params = {}) => 
    api.get('/companies', { params }),
  
  getById: (id) => 
    api.get(`/companies/${id}`),
};
