import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export const cinemasApi = {
  list: (params) => api.get('/cinemas', { params }),
  get: (id) => api.get(`/cinemas/${id}`),
  create: (data) => api.post('/cinemas', data),
  update: (id, data) => api.put(`/cinemas/${id}`, data),
  delete: (id) => api.delete(`/cinemas/${id}`),
  halls: (id) => api.get(`/cinemas/${id}/halls`),
};

export const moviesApi = {
  list: (params) => api.get('/movies', { params }),
  get: (id) => api.get(`/movies/${id}`),
  create: (data) => api.post('/movies', data),
  update: (id, data) => api.put(`/movies/${id}`, data),
  delete: (id) => api.delete(`/movies/${id}`),
};

export const showtimesApi = {
  list: (params) => api.get('/showtimes', { params }),
  get: (id) => api.get(`/showtimes/${id}`),
  seats: (id) => api.get(`/showtimes/${id}/seats`),
};

export const seatsApi = {
  lock: (data) => api.post('/seats/lock', data),
  unlock: (data) => api.post('/seats/unlock', data),
};

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  refund: (id) => api.post(`/orders/${id}/refund`),
};

export const audiencesApi = {
  list: (params) => api.get('/audiences', { params }),
  get: (id) => api.get(`/audiences/${id}`),
  create: (data) => api.post('/audiences', data),
  update: (id, data) => api.put(`/audiences/${id}`, data),
  delete: (id) => api.delete(`/audiences/${id}`),
};

export const walletApi = {
  cards: (audienceId) => api.get(`/wallet/card/${audienceId}`),
  transactions: (cardId) => api.get(`/wallet/transactions/${cardId}`),
  recharge: (data) => api.post('/wallet/recharge', data),
  consume: (data) => api.post('/wallet/consume', data),
  enterpriseGrant: (data) => api.post('/wallet/enterprise-grant', data),
};

export const crowdfundingApi = {
  list: (params) => api.get('/crowdfunding', { params }),
  get: (id) => api.get(`/crowdfunding/${id}`),
  create: (data) => api.post('/crowdfunding', data),
  update: (id, data) => api.put(`/crowdfunding/${id}`, data),
  join: (id, data) => api.post(`/crowdfunding/${id}/join`, data),
  participants: (id) => api.get(`/crowdfunding/${id}/participants`),
  autoConfirm: (id) => api.post(`/crowdfunding/${id}/auto-confirm`),
};

export const concessionsApi = {
  list: (params) => api.get('/concessions', { params }),
  get: (id) => api.get(`/concessions/${id}`),
  create: (data) => api.post('/concessions', data),
  update: (id, data) => api.put(`/concessions/${id}`, data),
  delete: (id) => api.delete(`/concessions/${id}`),
  combos: () => api.get('/concessions/combos'),
  createCombo: (data) => api.post('/concessions/combos', data),
};

export const schedulingApi = {
  smartSchedule: (data) => api.post('/scheduling/smart-schedule', data),
  occupancyPrediction: (params) => api.get('/scheduling/occupancy-prediction', { params }),
  coldMovieStrategies: () => api.get('/scheduling/cold-movie-strategies'),
};

export const analyticsApi = {
  boxOfficeHeatmap: (params) => api.get('/analytics/box-office-heatmap', { params }),
  movieLifecycle: (movieId) => api.get(`/analytics/movie-lifecycle/${movieId}`),
  audienceLtv: (params) => api.get('/analytics/audience-ltv', { params }),
  abTestResults: (testId) => api.get(`/analytics/ab-test-results/${testId}`),
};

export default api;
