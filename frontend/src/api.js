import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:59012/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDevices = (params) => api.get('/devices', { params });
export const getDevice = (id) => api.get(`/devices/${id}`);
export const createDevice = (data) => api.post('/devices', data);
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data);
export const deleteDevice = (id) => api.delete(`/devices/${id}`);
export const controlDevice = (id, action, params) => api.post(`/devices/${id}/control`, { action, params });

export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);

export const getScenes = () => api.get('/scenes');
export const createScene = (data) => api.post('/scenes', data);
export const updateScene = (id, data) => api.put(`/scenes/${id}`, data);
export const deleteScene = (id) => api.delete(`/scenes/${id}`);
export const executeScene = (id) => api.post(`/scenes/${id}/execute`);

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);

export const getVoiceLogs = () => api.get('/voice-logs');
export const sendVoiceCommand = (command, userId) => api.post('/voice-command', { command, user_id: userId });

export const getDeviceTelemetry = (id, period) => api.get(`/devices/${id}/telemetry`, { params: { period } });

export default api;
