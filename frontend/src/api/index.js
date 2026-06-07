import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  hot: () => api.get('/events/hot'),
  detail: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data)
};

export const seatsAPI = {
  getByEvent: (eventId) => api.get(`/seats/event/${eventId}`),
  lock: (seatIds) => api.post('/seats/lock', { seatIds }),
  unlock: (seatIds) => api.post('/seats/unlock', { seatIds }),
  createMap: (data) => api.post('/seats/map', data),
  createSeats: (data) => api.post('/seats/batch', data)
};

export const pricingAPI = {
  getByEvent: (eventId) => api.get(`/pricing/event/${eventId}`),
  calculate: (data) => api.post('/pricing/calculate', data),
  create: (data) => api.post('/pricing', data)
};

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  pay: (id) => api.post(`/orders/${id}/pay`),
  refund: (id) => api.post(`/orders/${id}/refund`)
};

export const eticketsAPI = {
  my: () => api.get('/etickets/my'),
  detail: (ticketNo) => api.get(`/etickets/${ticketNo}`),
  verify: (data) => api.post('/etickets/verify', data)
};

export const discoverAPI = {
  articles: (params) => api.get('/discover/articles', { params }),
  article: (id) => api.get(`/discover/articles/${id}`),
  createArticle: (data) => api.post('/discover/articles', data),
  comments: (id) => api.get(`/discover/articles/${id}/comments`),
  addComment: (id, content) => api.post(`/discover/articles/${id}/comments`, { content }),
  tags: () => api.get('/discover/tags')
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  sales: (params) => api.get('/admin/sales', { params }),
  agents: () => api.get('/admin/agents'),
  createAgent: (data) => api.post('/admin/agents', data),
  settlements: () => api.get('/admin/settlements'),
  generateSettlement: (data) => api.post('/admin/settlements/generate', data)
};

export default api;
