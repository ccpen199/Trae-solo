import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || { success: false, error: '网络错误' });
  }
);

export const authApi = {
  login: (username, password) => api.post('/users/login', { username, password })
};

export const orderApi = {
  create: (data) => api.post('/orders/create', data),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  assignDriver: (orderId, data) => api.post(`/orders/${orderId}/assign-driver`, data),
  driverAccept: (orderId, data) => api.post(`/orders/${orderId}/driver-accept`, data),
  startRide: (orderId, data) => api.post(`/orders/${orderId}/start-ride`, data),
  confirmArrival: (orderId, data) => api.post(`/orders/${orderId}/confirm-arrival`, data),
  payment: (orderId, data) => api.post(`/orders/${orderId}/payment`, data),
  rate: (orderId, data) => api.post(`/orders/${orderId}/rate`, data),
  cancel: (orderId, data) => api.post(`/orders/${orderId}/cancel`, data),
  getPassengerOrders: (passengerId, status) => api.get(`/orders/passenger/${passengerId}/orders`, { params: { status } }),
  getDriverOrders: (driverId, status) => api.get(`/orders/driver/${driverId}/orders`, { params: { status } }),
  getAvailableDrivers: (lat, lng, rideType) => api.get('/orders/available-drivers', { params: { lat, lng, ride_type: rideType } })
};

export const userApi = {
  getNotifications: (userId) => api.get('/users/notifications', { params: { user_id: userId } }),
  markNotificationRead: (id) => api.post(`/users/notifications/${id}/read`),
  getTodos: (userId, status) => api.get('/users/todos', { params: { user_id: userId, status } }),
  getDrivers: (status) => api.get('/users/drivers', { params: { status } }),
  getPassengers: () => api.get('/users/passengers'),
  getDriver: (driverId) => api.get(`/users/driver/${driverId}`),
  getPassenger: (passengerId) => api.get(`/users/passenger/${passengerId}`),
  updateDriverLocation: (driverId, data) => api.post(`/users/driver/${driverId}/update-location`, data)
};

export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
  getDailyStats: (date) => api.get('/dashboard/daily-stats', { params: { date } }),
  getExceptions: (status, orderId) => api.get('/dashboard/exceptions', { params: { status, order_id: orderId } }),
  handleException: (exceptionId, data) => api.post(`/dashboard/exceptions/${exceptionId}/handle`, data),
  getDriverStats: (driverId, startDate, endDate) => api.get(`/dashboard/driver/${driverId}/stats`, { params: { start_date: startDate, end_date: endDate } }),
  getPassengerStats: (passengerId, startDate, endDate) => api.get(`/dashboard/passenger/${passengerId}/stats`, { params: { start_date: startDate, end_date: endDate } }),
  getOrderTracks: (orderId) => api.get(`/dashboard/order/${orderId}/tracks`),
  createSnapshot: (snapshotType) => api.post('/dashboard/snapshot', { snapshot_type: snapshotType }),
  getSnapshots: (startDate, endDate, snapshotType) => api.get('/dashboard/snapshots', { params: { start_date: startDate, end_date: endDate, snapshot_type: snapshotType } }),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params })
};

export default api;
