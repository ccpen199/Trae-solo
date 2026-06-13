import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store';

const baseURL = '/api/v1';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useAuthStore.getState();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        useAuthStore.getState().logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        message.error('没有权限执行此操作');
      } else if (status === 404) {
        message.error('资源不存在');
      } else if (status >= 500) {
        message.error(data?.message || '服务器错误，请稍后重试');
      } else if (data?.message) {
        message.error(data.message);
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  },
);

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => axiosInstance.get(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosInstance.post(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosInstance.patch(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => axiosInstance.put(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => axiosInstance.delete(url, config),
};

export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email?: string; phone?: string; password: string }) => api.post('/auth/register', data),
  refresh: (data: { refreshToken: string }) => api.post('/auth/refresh', data),
  logout: (data: { refreshToken: string }) => api.post('/auth/logout', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data: { oldPassword: string; newPassword: string }) => api.patch('/auth/password', data),
  vendorAuth: (data: { apiKey: string; apiSecret: string }) => api.post('/auth/vendor', data),
};

export const deviceAPI = {
  getList: (params?: any) => api.get('/devices', { params }),
  getStats: () => api.get('/devices/stats'),
  getDetail: (id: string) => api.get(`/devices/${id}`),
  update: (id: string, data: any) => api.patch(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
  claim: (data: { deviceId: string; name?: string; roomId?: string }) => api.post('/devices/claim', data),
  getTelemetry: (id: string, range?: string) => api.get(`/devices/${id}/telemetry`, { params: { range } }),
  registerByVendor: (data: any) => api.post('/devices/vendor/register', data),
  triggerDiscovery: (data: { protocols: string[]; timeoutMs?: number }) => api.post('/devices/discovery', data),
};

export const controlAPI = {
  sendCommand: (deviceId: string, data: { command: string; params?: Record<string, any>; timeoutMs?: number }) =>
    api.post(`/control/${deviceId}/command`, data),
  batchControl: (data: { commands: any[] }) => api.post('/control/batch', data),
  delayControl: (deviceId: string, data: { command: string; params: Record<string, any>; delayMs: number }) =>
    api.post(`/control/${deviceId}/delay`, data),
  scheduleControl: (data: any) => api.post('/control/schedule', data),
  getSchedules: (deviceId?: string) => api.get('/control/schedule', { params: { deviceId } }),
  toggleSchedule: (taskId: string, enabled: boolean) =>
    api.patch(`/control/schedule/${taskId}/toggle`, { enabled }),
  deleteSchedule: (taskId: string) => api.delete(`/control/schedule/${taskId}`),
  getHistory: (deviceId: string, params?: any) => api.get(`/control/${deviceId}/history`, { params }),
};

export const shareAPI = {
  shareDevice: (data: { deviceId: string; shareeIdOrEmail: string; permission: string; expiredAt?: string }) =>
    api.post('/share', data),
  getDeviceShares: (deviceId: string) => api.get(`/share/device/${deviceId}`),
  getSharedWithMe: () => api.get('/share/with-me'),
  updatePermission: (shareId: string, data: { permission: string; expiredAt?: string }) =>
    api.patch(`/share/${shareId}`, data),
  revokeShare: (shareId: string) => api.delete(`/share/${shareId}`),
  checkPermission: (deviceId: string, permission: string) =>
    api.get('/share/check', { params: { deviceId, permission } }),
};

export const sceneAPI = {
  getList: (status?: string) => api.get('/scenes', { params: { status } }),
  getDetail: (id: string) => api.get(`/scenes/${id}`),
  create: (data: any) => api.post('/scenes', data),
  update: (id: string, data: any) => api.patch(`/scenes/${id}`, data),
  delete: (id: string) => api.delete(`/scenes/${id}`),
  toggle: (id: string, status: string) => api.post(`/scenes/${id}/toggle`, { status }),
  execute: (id: string) => api.post(`/scenes/${id}/execute`),
  duplicate: (id: string, data?: { name?: string }) => api.post(`/scenes/${id}/duplicate`, data),
};

export const voiceAPI = {
  sendCommand: (data: { text: string; asrSource?: string }) => api.post('/voice/command', data),
};

export const otaAPI = {
  getFirmwareList: (vendorId?: string, model?: string) => api.get('/ota/firmware', { params: { vendorId, model } }),
  uploadFirmware: (data: any) => api.post('/ota/firmware', data),
  checkUpdate: (deviceId: string) => api.get(`/ota/check/${deviceId}`),
  startOta: (data: { deviceId: string; firmwareId: string }) => api.post('/ota/upgrade', data),
  batchOta: (data: { deviceIds: string[]; firmwareId: string }) => api.post('/ota/batch-upgrade', data),
  getOtaJobs: (deviceId?: string, status?: string) => api.get('/ota/jobs', { params: { deviceId, status } }),
  cancelOta: (jobId: string) => api.delete(`/ota/jobs/${jobId}`),
};

export const monitoringAPI = {
  getDashboard: () => api.get('/monitoring/dashboard'),
  getAdminDashboard: () => api.get('/monitoring/admin-dashboard'),
  getOnlineRate: (range?: string, homeId?: string) => api.get('/monitoring/online-rate', { params: { range, homeId } }),
  getPowerAnalytics: (range?: string) => api.get('/monitoring/power-analytics', { params: { range } }),
  getAlerts: (params?: any) => api.get('/monitoring/alerts', { params }),
  acknowledgeAlert: (id: string) => api.post(`/monitoring/alerts/${id}/acknowledge`),
  resolveAlert: (id: string, data?: { resolutionNote?: string }) =>
    api.post(`/monitoring/alerts/${id}/resolve`, data),
  ignoreAlert: (id: string) => api.post(`/monitoring/alerts/${id}/ignore`),
  bulkResolve: (alertIds: string[]) => api.post('/monitoring/alerts/bulk-resolve', { alertIds }),
  getAlertStats: (since?: string) => api.get('/monitoring/alerts/stats', { params: { since } }),
  getNotifications: (limit?: number) => api.get('/monitoring/notifications', { params: { limit } }),
  sendNotification: (data: any) => api.post('/monitoring/notifications/send', data),
};

export const analyticsAPI = {
  getUsageReport: (range?: string) => api.get('/analytics/usage-report', { params: { range } }),
  getDeviceAnalytics: (deviceId: string, range?: string) =>
    api.get(`/analytics/device/${deviceId}`, { params: { range } }),
  getSceneInsights: () => api.get('/analytics/scene-insights'),
  getSuggestions: () => api.get('/analytics/learning/suggestions'),
  applyOptimization: (sceneId: string, optimization: any) =>
    api.post(`/analytics/learning/apply/${sceneId}`, { optimization }),
  createSceneFromSuggestion: (suggestion: any) =>
    api.post('/analytics/learning/create-scene', { suggestion }),
  getHabitsReport: () => api.get('/analytics/learning/habits'),
  logBehavior: (data: any) => api.post('/analytics/behavior/log', data),
  exportData: () => api.get('/analytics/export'),
};

export const homeAPI = {
  getHomes: () => api.get('/homes'),
  createHome: (data: any) => api.post('/homes', data),
  getHome: (id: string) => api.get(`/homes/${id}`),
  updateHome: (id: string, data: any) => api.patch(`/homes/${id}`, data),
  addMember: (id: string, data: { emailOrPhone: string; role: string }) =>
    api.post(`/homes/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/homes/${id}/members/${userId}`),
  createRoom: (homeId: string, data: { name: string; icon?: string }) =>
    api.post(`/homes/${homeId}/rooms`, data),
  updateRoom: (roomId: string, data: any) => api.patch(`/homes/rooms/${roomId}`, data),
  deleteRoom: (roomId: string) => api.delete(`/homes/rooms/${roomId}`),
  getRoomsWithDevices: (homeId: string) => api.get(`/homes/${homeId}/devices-by-room`),
};

export const vendorAPI = {
  getList: (params?: any) => api.get('/vendors', { params }),
  getStats: () => api.get('/vendors/stats'),
  getDetail: (id: string) => api.get(`/vendors/${id}`),
  create: (data: any) => api.post('/vendors', data),
  update: (id: string, data: any) => api.patch(`/vendors/${id}`, data),
  rotateCredentials: (id: string) => api.post(`/vendors/${id}/rotate-credentials`),
  updateWhitelist: (id: string, ipRanges: string[]) => api.patch(`/vendors/${id}/whitelist`, { ipRanges }),
  setStatus: (id: string, status: string) => api.patch(`/vendors/${id}/status`, { status }),
  getVendorDevices: (id: string, params?: any) => api.get(`/vendors/${id}/devices`, { params }),
};
