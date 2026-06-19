import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    if (response.data.code === 0) {
      return response.data.data;
    }
    return Promise.reject(new Error(response.data.message || '请求失败'));
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const riderApi = {
  getList: (params?: any) => api.get('/riders', { params }),
  getDetail: (id: number) => api.get(`/riders/${id}`),
  getLocation: (id: number) => api.get(`/riders/${id}/location`),
  getTrack: (id: number, hours?: number) => api.get(`/riders/${id}/track`, { params: { hours } }),
  getOnline: () => api.get('/riders/online'),
  create: (data: any) => api.post('/riders', data),
  updateStatus: (id: number, status: string) => api.put(`/riders/${id}/status`, { status }),
  getReportStatus: (id: number) => api.get(`/riders/${id}/report-status`),
  getOfflineCache: (id: number) => api.get(`/riders/${id}/offline-cache`),
  getAssignments: (id: number) => api.get(`/riders/${id}/assignments`),
  getAnomalyRecords: (id: number) => api.get(`/riders/${id}/anomaly-records`),
};

export const orderApi = {
  getList: (params?: any) => api.get('/orders', { params }),
  getDetail: (id: number) => api.get(`/orders/${id}`),
  getPending: () => api.get('/orders/pending'),
  getPlatformStats: () => api.get('/orders/platform-stats'),
  create: (data: any) => api.post('/orders', data),
  dispatch: (id: number) => api.post(`/orders/${id}/dispatch`),
  updateStatus: (id: number, status: string, data?: any) =>
    api.put(`/orders/${id}/status`, { status, ...data }),
  accept: (id: number, riderId: number, assignmentId: number) =>
    api.post(`/orders/${id}/accept`, { rider_id: riderId, assignment_id: assignmentId }),
  reject: (id: number, riderId: number, assignmentId: number) =>
    api.post(`/orders/${id}/reject`, { rider_id: riderId, assignment_id: assignmentId }),
};

export const incomeApi = {
  getRiderList: (riderId: number, params?: any) =>
    api.get(`/income/rider/${riderId}`, { params }),
  getBalance: (riderId: number) => api.get(`/income/rider/${riderId}/balance`),
  getSummary: (riderId: number, days?: number) =>
    api.get(`/income/rider/${riderId}/summary`, { params: { days } }),
};

export const complaintApi = {
  getList: (params?: any) => api.get('/complaints', { params }),
  getStats: () => api.get('/complaints/stats'),
  getDetail: (id: number) => api.get(`/complaints/${id}`),
  create: (data: any) => api.post('/complaints', data),
  handle: (id: number, data: any) => api.post(`/complaints/${id}/handle`, data),
};

export const healthApi = {
  getSummary: () => api.get('/health-monitor/summary'),
  getRealtime: () => api.get('/health-monitor/realtime'),
  getTrend: (hours?: number) => api.get('/health-monitor/trend', { params: { hours } }),
};

export const predictionApi = {
  getTrend: (regionId?: number, hours?: number) =>
    api.get('/prediction/trend', { params: { region_id: regionId, hours } }),
  getRegionStats: (regionId: number) => api.get(`/prediction/region/${regionId}`),
  generate: (regionId?: number, days?: number) =>
    api.post('/prediction/generate', { region_id: regionId, days }),
};

export const creditApi = {
  getHistory: (riderId: number, params?: any) =>
    api.get(`/credit/rider/${riderId}/history`, { params }),
  getLevel: (riderId: number) => api.get(`/credit/rider/${riderId}/level`),
  adjust: (riderId: number, data: any) =>
    api.post(`/credit/rider/${riderId}/adjust`, data),
};
