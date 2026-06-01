import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53450/api';

const api = {
  getStations: () => axios.get(`${API_BASE}/stations`),
  getStation: (id) => axios.get(`${API_BASE}/stations/${id}`),
  getStationMap: (id) => axios.get(`${API_BASE}/stations/${id}/map`),
  
  getOrders: (params) => axios.get(`${API_BASE}/orders`, { params }),
  getOrder: (id, type) => axios.get(`${API_BASE}/orders/${id}?type=${type}`),
  getCombinedOrders: () => axios.get(`${API_BASE}/orders/combined`),
  createParkingOrder: (data) => axios.post(`${API_BASE}/orders/parking`, data),
  createChargingOrder: (data) => axios.post(`${API_BASE}/orders/charging`, data),
  exitParking: (id) => axios.post(`${API_BASE}/orders/parking/${id}/exit`),
  stopCharging: (id, data) => axios.post(`${API_BASE}/orders/charging/${id}/stop`, data),
  createPayment: (data) => axios.post(`${API_BASE}/orders/pay`, data),
  
  getDevices: (params) => axios.get(`${API_BASE}/devices`, { params }),
  getDeviceStats: () => axios.get(`${API_BASE}/devices/stats`),
  updateDeviceStatus: (id, status) => axios.put(`${API_BASE}/devices/${id}/status`, { status }),
  
  getWorkOrders: (params) => axios.get(`${API_BASE}/work-orders`, { params }),
  updateWorkOrder: (id, data) => axios.put(`${API_BASE}/work-orders/${id}`, data),
  
  getAlerts: (params) => axios.get(`${API_BASE}/alerts`, { params }),
  resolveAlert: (id) => axios.put(`${API_BASE}/alerts/${id}/resolve`),
  
  getDashboardStats: () => axios.get(`${API_BASE}/reports/dashboard`),
  getParkingUtilization: (days) => axios.get(`${API_BASE}/reports/parking-utilization?days=${days}`),
  getChargingUtilization: (days) => axios.get(`${API_BASE}/reports/charging-utilization?days=${days}`),
  getRevenueAnalysis: (days) => axios.get(`${API_BASE}/reports/revenue?days=${days}`),
  getPeakLoad: () => axios.get(`${API_BASE}/reports/peak-load`),
  getOvertimeAnalysis: () => axios.get(`${API_BASE}/reports/overtime`),
  
  getPricingRules: () => axios.get(`${API_BASE}/pricing-rules`),
  updatePricingRule: (id, data) => axios.put(`${API_BASE}/pricing-rules/${id}`, data),
  
  getUsers: () => axios.get(`${API_BASE}/users`),
  getUser: (id) => axios.get(`${API_BASE}/users/${id}`),
  createUser: (data) => axios.post(`${API_BASE}/users`, data),
  updateUser: (id, data) => axios.put(`${API_BASE}/users/${id}`, data),
  
  getReservations: (params) => axios.get(`${API_BASE}/reservations`, { params }),
  createReservation: (data) => axios.post(`${API_BASE}/reservations`, data),
  cancelReservation: (id) => axios.put(`${API_BASE}/reservations/${id}/cancel`),
  
  health: () => axios.get(`${API_BASE}/health`)
};

export default api;
