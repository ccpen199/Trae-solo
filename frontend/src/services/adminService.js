import api from './api';

export const getDashboardStats = () => api.get('/admin/dashboard/stats');
export const getEngineerRadar = (id) => api.get(`/admin/engineers/${id}/radar`);
export const getEngineerPerformance = () => api.get('/admin/engineers/performance');
export const getFaultHeatmap = () => api.get('/admin/faults/heatmap');
export const getPartsForecast = () => api.get('/admin/parts/forecast');
export const getOrderTrend = (days) => api.get('/admin/orders/trend', { params: { days } });
export const getParts = (params) => api.get('/admin/parts', { params });
export const createPart = (data) => api.post('/admin/parts', data);
export const updatePart = (id, data) => api.put(`/admin/parts/${id}`, data);
export const getUsedDevices = (params) => api.get('/admin/used-devices', { params });
export const createUsedDevice = (data) => api.post('/admin/used-devices', data);
export const triggerCallback = (orderId) => api.post('/admin/callback/trigger', { orderId });
export const bindEquipment = (id, equipmentId) => api.put(`/admin/engineers/${id}/equipment`, { equipmentId });
export const updateUsedDevice = (id, data) => api.put(`/admin/used-devices/${id}`, data);
