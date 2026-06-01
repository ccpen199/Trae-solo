import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getOverdueTrend = () => api.get('/dashboard/overdue-trend');

export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const approveCustomer = (id, data) => api.put(`/customers/${id}/approve`, data);
export const rejectCustomer = (id, data) => api.put(`/customers/${id}/reject`, data);

export const getContracts = () => api.get('/contracts');
export const getContract = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);

export const getDevices = (params) => api.get('/devices', { params });
export const getDevice = (id) => api.get(`/devices/${id}`);
export const updateDeviceLocation = (id, data) => api.put(`/devices/${id}/location`, data);
export const addMaintenance = (id, data) => api.post(`/devices/${id}/maintenance`, data);

export const getAlerts = () => api.get('/alerts');
export const resolveAlert = (id, data) => api.put(`/alerts/${id}/resolve`, data);

export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const payBill = (id, data) => api.post(`/bills/${id}/pay`, data);
export const addCollection = (id, data) => api.post(`/bills/${id}/collection`, data);
export const applyReduction = (id, data) => api.put(`/bills/${id}/reduction`, data);

export const checkHealth = () => api.get('/health');

export default api;
