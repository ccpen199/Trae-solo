import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[API Error]', error.message);
    return Promise.reject(error);
  }
);

export const health = () => api.get('/health');
export const getDevices = (params) => api.get('/devices', { params });
export const getDevice = (id) => api.get(`/devices/${id}`);
export const createDevice = (data) => api.post('/devices', data);
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data);
export const controlDevice = (id, action) => api.post(`/devices/${id}/control`, { action });
export const discoverDevices = (protocol) => api.post('/devices/discover', { protocol });
export const getDeviceHeartbeats = (id) => api.get(`/devices/${id}/heartbeats`);

export const getHomes = () => api.get('/homes');
export const getRooms = (homeId) => api.get(`/homes/${homeId}/rooms`);
export const getTopology = (homeId) => api.get(`/homes/${homeId}/topology`);
export const createRoom = (homeId, data) => api.post(`/homes/${homeId}/rooms`, data);
export const updateRoom = (roomId, data) => api.put(`/homes/rooms/${roomId}`, data);
export const getDeviceGroups = () => api.get('/homes/device-groups');

export const getScenes = () => api.get('/scenes');
export const getScene = (id) => api.get(`/scenes/${id}`);
export const createScene = (data) => api.post('/scenes', data);
export const updateScene = (id, data) => api.put(`/scenes/${id}`, data);
export const executeScene = (id) => api.post(`/scenes/${id}/execute`);
export const getSceneExecutions = () => api.get('/scenes/executions/list');
export const analyzeKnowledgeGraph = () => api.get('/scenes/knowledge-graph/analyze');
export const getDetectedScenes = () => api.get('/scenes/detected/list');

export const getEnergyOverview = () => api.get('/energy/overview');
export const getEnergyTrends = (days) => api.get('/energy/trends', { params: { days } });
export const getEnergyMeters = () => api.get('/energy/meters');
export const getEnergyRecords = (params) => api.get('/energy/records', { params });

export const startVoiceSession = () => api.post('/voice/session/start');
export const sendVoiceCommand = (data) => api.post('/voice/command', data);
export const getVoiceHistory = () => api.get('/voice/history');

export const getDeviceHealth = () => api.get('/admin/health/devices');
export const getDashboardSummary = () => api.get('/admin/dashboard/summary');
export const getParentalStatus = () => api.get('/admin/parental/status');
export const updateParentalControls = (data) => api.post('/admin/parental/update', data);
export const getShoppingAccount = () => api.get('/admin/shopping/account');
export const rechargeAccount = (amount) => api.post('/admin/shopping/account/recharge', { amount });
export const getShoppingOrders = () => api.get('/admin/shopping/orders');
export const createOrder = (data) => api.post('/admin/shopping/order', data);
export const getContentList = () => api.get('/admin/content/list');
export const createContent = (data) => api.post('/admin/content', data);

export default api;
