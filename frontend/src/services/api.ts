import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:52661/api';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data)
};

export const deviceApi = {
  getDevices: (params?: { status?: string }) =>
    api.get('/devices', { params }),
  getDevice: (id: number) => api.get(`/devices/${id}`),
  bindDevice: (data: { device_type: string; device_name: string; device_uuid: string }) =>
    api.post('/devices/bind', data),
  updateDeviceStatus: (id: number, data: { status: string; reason?: string }) =>
    api.put(`/devices/${id}/status`, data),
  unbindDevice: (id: number) => api.delete(`/devices/${id}`),
  syncData: (data: { device_id: number; data_points: any[] }) =>
    api.post('/devices/sync', data),
  retrySync: (batchId: string) => api.post(`/devices/sync/retry/${batchId}`),
  revokeData: (id: number, data: { reason?: string }) =>
    api.post(`/devices/data/${id}/revoke`, data),
  supplementData: (data: { device_id: number; data_points: any[] }) =>
    api.post('/devices/data/supplement', data),
  getDataList: (params?: any) => api.get('/devices/data/list', { params }),
  getSyncHistory: (params?: any) => api.get('/devices/data/sync-history', { params })
};

export const goalApi = {
  getGoals: (params?: { status?: string }) => api.get('/goals', { params }),
  createGoal: (data: any) => api.post('/goals', data),
  updateGoal: (id: number, data: any) => api.put(`/goals/${id}`, data),
  getPlans: (params?: any) => api.get('/plans', { params }),
  getPlan: (id: number) => api.get(`/plans/${id}`),
  generatePlan: (data: { goal_type: string; goal_id?: number }) =>
    api.post('/plans/generate', data),
  approvePlan: (id: number) => api.post(`/plans/${id}/approve`),
  rejectPlan: (id: number, data: { rejection_reason?: string }) =>
    api.post(`/plans/${id}/reject`, data),
  returnPlan: (id: number, data: { return_reason?: string }) =>
    api.post(`/plans/${id}/return`, data),
  cancelPlan: (id: number) => api.post(`/plans/${id}/cancel`),
  adjustPlan: (id: number, data: any) => api.post(`/plans/${id}/adjust`, data),
  getPlanHistory: (id: number) => api.get(`/plans/${id}/history`)
};

export const workoutApi = {
  getWorkouts: (params?: any) => api.get('/workouts', { params }),
  getWorkout: (id: number) => api.get(`/workouts/${id}`),
  createWorkout: (data: any) => api.post('/workouts', data),
  revokeWorkout: (id: number, data: { reason?: string }) =>
    api.post(`/workouts/${id}/revoke`, data),
  getAnalysisSummary: (params?: { period?: string }) =>
    api.get('/workouts/analysis/summary', { params })
};

export const alertApi = {
  getAlerts: (params?: any) => api.get('/alerts', { params }),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  acknowledgeAlert: (id: number, data: { status?: string; notes?: string }) =>
    api.post(`/alerts/${id}/acknowledge`, data),
  contactEmergency: (id: number) => api.post(`/alerts/${id}/contact-emergency`),
  getAlertTypes: () => api.get('/alerts/types')
};

export const coachApi = {
  getAssignedUsers: () => api.get('/coach/assigned-users'),
  getUserTrend: (userId: number, params?: { period?: string }) =>
    api.get(`/coach/user/${userId}/trend`, { params }),
  createIntervention: (data: any) => api.post('/coach/intervention', data),
  implementIntervention: (id: number) => api.post(`/coach/intervention/${id}/implement`),
  getInterventions: (params?: any) => api.get('/coach/interventions', { params }),
  adjustPlan: (planId: number, data: any) => api.put(`/coach/plan/${planId}`, data)
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getOperationLogs: (params?: any) => api.get('/admin/operation-logs', { params }),
  getEntityHistory: (entityType: string, entityId: number) =>
    api.get(`/admin/entity-history/${entityType}/${entityId}`),
  getAnomalyReport: (params?: any) => api.get('/admin/anomaly-report', { params }),
  getSyncReport: (params?: any) => api.get('/admin/sync-report', { params }),
  getPlanCompletionReport: (params?: any) =>
    api.get('/admin/plan-completion-report', { params })
};
