import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58831/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    console.error('API错误:', error);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  register: (data: any) => api.post('/auth/register', data),
};

export const poiAPI = {
  getList: (params?: any) => api.get('/pois', { params }),
  getDetail: (id: number) => api.get(`/pois/${id}`),
  create: (data: any) => api.post('/pois', data),
  update: (id: number, data: any) => api.put(`/pois/${id}`, data),
};

export const providerAPI = {
  getList: (params?: any) => api.get('/providers', { params }),
  getDetail: (id: number) => api.get(`/providers/${id}`),
  getRenewalList: () => api.get('/providers/renewal'),
  create: (data: any) => api.post('/providers', data),
  update: (id: number, data: any) => api.put(`/providers/${id}`, data),
  renew: (id: number, annualReviewDate: string) =>
    api.put(`/providers/${id}/renew`, { annualReviewDate }),
  getReviews: (id: number) => api.get(`/providers/${id}/reviews`),
  addReview: (id: number, data: any) => api.post(`/providers/${id}/reviews`, data),
  sendRemind: (id: number, data?: any) => api.post(`/providers/${id}/remind`, data),
  getSettlements: (id: number) => api.get(`/providers/${id}/settlements`),
  getStats: () => api.get('/providers/stats'),
};

export const demandAPI = {
  getList: (params?: any) => api.get('/demands', { params }),
  getDetail: (id: number) => api.get(`/demands/${id}`),
  create: (data: any) => api.post('/demands', data),
  accept: (id: number, acceptorId: number, acceptorName?: string) =>
    api.post(`/demands/${id}/accept`, { acceptorId, acceptorName }),
  complete: (id: number, operatorId?: number, operatorName?: string) =>
    api.post(`/demands/${id}/complete`, { operatorId, operatorName }),
  getOperations: (id: number) => api.get(`/demands/${id}/operations`),
  dispute: (id: number, description: string, complainantId?: number, complainantName?: string) =>
    api.post(`/demands/${id}/dispute`, { description, complainantId, complainantName }),
};

export const statsAPI = {
  getOverview: (gridCode?: string) => api.get('/stats/overview', { params: gridCode ? { gridCode } : undefined }),
  getTopDemands: () => api.get('/stats/top-demands'),
  getTownCoverage: () => api.get('/stats/town-coverage'),
  getTownCoverageDetail: (cityCode?: string) => api.get('/stats/town-coverage-detail', { params: cityCode ? { cityCode } : undefined }),
  getSettlements: (params?: any) => api.get('/stats/settlements', { params }),
  getDisputes: () => api.get('/stats/disputes'),
  getDisputeTrend: () => api.get('/stats/dispute-trend'),
  getCityOverview: () => api.get('/stats/city-overview'),
};

export const gridAPI = {
  getList: (params?: any) => api.get('/grids', { params }),
  getDetail: (code: string) => api.get(`/grids/${code}`),
  getPOIs: (code: string) => api.get(`/grids/${code}/pois`),
  getProviders: (code: string) => api.get(`/grids/${code}/providers`),
  getDemands: (code: string) => api.get(`/grids/${code}/demands`),
};

export const announcementAPI = {
  getList: (params?: any) => api.get('/announcements', { params }),
  getDetail: (id: number) => api.get(`/announcements/${id}`),
  create: (data: any) => api.post('/announcements', data),
};

export const dialectAPI = {
  search: (keyword: string, gridCode?: string) =>
    api.get('/dialect/search', { params: { keyword, gridCode } }),
  getPopular: (gridCode?: string, limit?: number) =>
    api.get('/dialect/popular', { params: { gridCode, limit } }),
  increment: (id: number) => api.post(`/dialect/${id}/increment`),
  create: (data: any) => api.post('/dialect', data),
};

export const recommendAPI = {
  getByDemand: (demandId: number) => api.get(`/recommend/demand/${demandId}`),
  share: (data: any) => api.post('/recommend/share', data),
  view: (id: number) => api.post(`/recommend/${id}/view`),
  getStats: () => api.get('/recommend/stats'),
};

export default api;
