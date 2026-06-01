import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password })
};

export const devicesApi = {
  getDevices: () => api.get('/devices'),
  getDevice: (id: string) => api.get(`/devices/${id}`),
  createDevice: (data: any) => api.post('/devices', data),
  updateDevice: (id: string, data: any) => api.put(`/devices/${id}`, data),
  deleteDevice: (id: string) => api.delete(`/devices/${id}`),
  sendCommand: (id: string, command: string, params: any) =>
    api.post(`/devices/${id}/command`, { command, params }),
  discover: () => api.post('/devices/discover'),
  onboard: (id: string, ssid?: string, password?: string) =>
    api.post(`/devices/${id}/onboard`, { ssid, password }),
  getLogs: (id: string) => api.get(`/devices/${id}/logs`),
  upgradeFirmware: (id: string, firmware_id: string, version: string) =>
    api.post(`/devices/${id}/firmware-upgrade`, { firmware_id, version }),
  getAlerts: (id: string) => api.get(`/devices/${id}/alerts`)
};

export const scenesApi = {
  getScenes: () => api.get('/scenes'),
  getScene: (id: string) => api.get(`/scenes/${id}`),
  createScene: (data: any) => api.post('/scenes', data),
  updateScene: (id: string, data: any) => api.put(`/scenes/${id}`, data),
  deleteScene: (id: string) => api.delete(`/scenes/${id}`),
  executeScene: (id: string) => api.post(`/scenes/${id}/execute`),
  getLogs: (id: string) => api.get(`/scenes/${id}/logs`)
};

export const permissionsApi = {
  getDevicePermissions: (deviceId: string) => api.get(`/permissions/devices/${deviceId}`),
  shareDevice: (deviceId: string, username: string, access_level: string, expires_at?: number) =>
    api.post(`/permissions/devices/${deviceId}/share`, { username, access_level, expires_at }),
  removePermission: (deviceId: string, userId: string) =>
    api.delete(`/permissions/devices/${deviceId}/users/${userId}`),
  createTemporaryAccess: (device_id: string, expires_in_minutes?: number) =>
    api.post('/permissions/temporary', { device_id, expires_in_minutes }),
  redeemTemporaryAccess: (code: string) =>
    api.post(`/permissions/temporary/${code}/redeem`),
  getUsers: () => api.get('/permissions/users'),
  getMe: () => api.get('/permissions/me')
};

export const adminApi = {
  getAlerts: (resolved = false) => api.get('/admin/alerts', { params: { resolved } }),
  resolveAlert: (id: string) => api.post(`/admin/alerts/${id}/resolve`),
  getOperationLogs: (module?: string) => api.get('/admin/logs/operations', { params: { module } }),
  getStats: () => api.get('/admin/stats'),
  getFirmwares: () => api.get('/admin/firmware'),
  upgradeFirmware: (deviceId: string, firmware_id: string) =>
    api.post(`/admin/firmware/${deviceId}/upgrade`, { firmware_id })
};

export default api;
