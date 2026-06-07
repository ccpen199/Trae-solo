import axios from 'axios';
import type {
  ApiResponse, Estate, Property, Broker, POI, MetroLine,
  SchoolDistrict, Appointment, PriceEvaluation, CommuteResult,
  TrainingCourse, Commission, CommissionStats, Store, User, CustomerFollow,
  AuditRecord,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const cleanParams = (params: any): any => {
  if (!params) return undefined;
  const cleaned: any = {};
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

api.interceptors.request.use((config) => {
  try {
    const sessionId = localStorage.getItem('sessionId');
    const userId = localStorage.getItem('userId');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  } catch (e) {
    console.warn('Failed to access localStorage:', e);
  }
  if (config.params) {
    config.params = cleanParams(config.params);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const estateApi = {
  getList: (params?: any) => api.get<any, ApiResponse<Estate[]>>('/estates', { params }),
  getById: (id: number) => api.get<any, ApiResponse<Estate>>(`/estates/${id}`),
  create: (data: any) => api.post<any, ApiResponse>('/estates', data),
  update: (id: number, data: any) => api.put<any, ApiResponse>(`/estates/${id}`, data),
};

export const propertyApi = {
  getList: (params?: any) => api.get<any, ApiResponse<Property[]>>('/properties', { params }),
  getById: (id: number) => api.get<any, ApiResponse<Property>>(`/properties/${id}`),
  getSimilar: (id: number, limit = 6) => api.get<any, ApiResponse<Property[]>>(`/properties/${id}/similar`, { params: { limit } }),
  getRecommendations: (params?: any) => api.get<any, ApiResponse<Property[]>>('/properties/recommendations', { params }),
  checkFake: (id: number) => api.get<any, ApiResponse>(`/properties/${id}/check-fake`),
  create: (data: any) => api.post<any, ApiResponse>('/properties', data),
  update: (id: number, data: any) => api.put<any, ApiResponse>(`/properties/${id}`, data),
  evaluate: (data: any) => api.post<any, ApiResponse<PriceEvaluation>>('/properties/evaluate', data),
};

export const brokerApi = {
  getList: (params?: any) => api.get<any, ApiResponse<Broker[]>>('/brokers', { params }),
  getById: (id: number) => api.get<any, ApiResponse<Broker>>(`/brokers/${id}`),
  getWorkbench: (brokerId: number) => api.get<any, ApiResponse>(`/brokers/${brokerId}/workbench`),
  getFreeSlots: (brokerId: number, date?: string) => api.get<any, ApiResponse>(`/brokers/${brokerId}/free-slots`, { params: { date } }),
  getTraining: (brokerId: number) => api.get<any, ApiResponse>(`/brokers/${brokerId}/training`),
  updateTrainingProgress: (id: number, data: any) => api.put<any, ApiResponse>(`/brokers/training/${id}/progress`, data),
  createFollow: (data: any) => api.post<any, ApiResponse<CustomerFollow>>('/brokers/follows', data),
  createAppointment: (data: any) => api.post<any, ApiResponse<Appointment>>('/brokers/appointments', data),
};

export const mapApi = {
  getPOIs: (params?: any) => api.get<any, ApiResponse<POI[]>>('/map/pois', { params }),
  getMetroLines: () => api.get<any, ApiResponse<MetroLine[]>>('/map/metro-lines'),
  getSchoolDistricts: (params?: any) => api.get<any, ApiResponse<SchoolDistrict[]>>('/map/school-districts', { params }),
  getTiles: () => api.get<any, ApiResponse>('/map/tiles'),
  getNearby: (params?: any) => api.get<any, ApiResponse>('/map/nearby', { params }),
  getEstatesByMetro: (params?: any) => api.get<any, ApiResponse>('/map/estates-by-metro', { params }),
  getCommutePolygon: (params?: any) => api.get<any, ApiResponse>('/map/commute-polygon', { params }),
  calculateCommute: (data: any) => api.post<any, ApiResponse<CommuteResult>>('/map/calculate-commute', data),
  getHealth: () => axios.get('/api/health'),
};

export const adminApi = {
  getDashboard: () => api.get<any, ApiResponse>('/admin/dashboard'),
  getFakeProperties: (params?: any) => api.get<any, ApiResponse<Property[]>>('/admin/fake-properties', { params }),
  getEstateDictionary: (params?: any) => api.get<any, ApiResponse<Estate[]>>('/admin/estate-dictionary', { params }),
  syncEstateDictionary: (ids: number[]) => api.post<any, ApiResponse>('/admin/estate-dictionary/sync', { ids }),
  markFakeProperty: (id: number, data: any) => api.put<any, ApiResponse>(`/admin/properties/${id}/fake`, data),
  getStores: (params?: any) => api.get<any, ApiResponse<Store[]>>('/admin/stores', { params }),
  getUsers: (params?: any) => api.get<any, ApiResponse<User[]>>('/admin/users', { params }),
  getCourses: (params?: any) => api.get<any, ApiResponse<TrainingCourse[]>>('/admin/courses', { params }),
  createCourse: (data: any) => api.post<any, ApiResponse>('/admin/courses', data),
  getCommissions: (params?: any) => api.get<any, ApiResponse<Commission[]>>('/admin/commissions', { params }),
  getCommissionStats: (params?: any) => api.get<any, ApiResponse<CommissionStats>>('/admin/commissions/stats', { params }),
  getCommissionDetail: (id: number) => api.get<any, ApiResponse<Commission>>(`/admin/commissions/${id}`),
  settleCommission: (id: number, data: { remark?: string }) => api.put<any, ApiResponse>(`/admin/commissions/${id}/settle`, data),
  batchSettleCommissions: (data: { ids: number[]; remark?: string }) => api.post<any, ApiResponse>('/admin/commissions/batch-settle', data),
  rejectCommission: (id: number, data: { reason: string }) => api.put<any, ApiResponse>(`/admin/commissions/${id}/reject`, data),
  getBrokers: (params?: any) => api.get<any, ApiResponse<Broker[]>>('/admin/brokers', { params }),
};

export default api;
