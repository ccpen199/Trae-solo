import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  deviceAuth: (data) => api.post('/auth/device/auth', data),
  verifyPhone: (data) => api.post('/auth/device/verify-phone', data),
}

export const deviceAPI = {
  getDevices: (params) => api.get('/devices', { params }),
  getDevice: (id) => api.get(`/devices/${id}`),
  createDevice: (data) => api.post('/devices', data),
  updateDevice: (id, data) => api.put(`/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/devices/${id}`),
  getRealtimeData: (id) => api.get(`/devices/${id}/realtime`),
  postRealtimeData: (id, data) => api.post(`/devices/${id}/realtime`, data),
  getDeviceStats: () => api.get('/devices/stats/overview'),
}

export const studentAPI = {
  getStudents: (params) => api.get('/students', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  getProfile: () => api.get('/students/profile'),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  syncAcademic: (data) => api.post('/students/sync/academic', data),
}

export const transactionAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  getMonthlyStats: () => api.get('/transactions/stats/monthly'),
  startTransaction: (data) => api.post('/transactions/start', data),
  endTransaction: (id, data) => api.post(`/transactions/${id}/end`, data),
  recharge: (data) => api.post('/transactions/recharge', data),
  getRechargeHistory: () => api.get('/transactions/recharge/history'),
}

export const alertAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  checkAnomaly: (data) => api.post('/alerts/check-anomaly', data),
  resolveAlert: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  getAlertStats: () => api.get('/alerts/stats'),
}

export const analyticsAPI = {
  getEnergyOverview: (params) => api.get('/analytics/energy/overview', { params }),
  getEnergyByHour: (params) => api.get('/analytics/energy/by-hour', { params }),
  getEnergyByBuilding: (params) => api.get('/analytics/energy/by-building', { params }),
  getEnergyDaily: (params) => api.get('/analytics/energy/daily', { params }),
  getEnergySeasonal: () => api.get('/analytics/energy/seasonal'),
}

export const pricingAPI = {
  getPricingRules: () => api.get('/pricing'),
  getActivePricing: () => api.get('/pricing/active'),
  createPricing: (data) => api.post('/pricing', data),
  updatePricing: (id, data) => api.put(`/pricing/${id}`, data),
  deletePricing: (id) => api.delete(`/pricing/${id}`),
  calculatePrice: (data) => api.post('/pricing/calculate', data),
}

export const messageAPI = {
  getMessages: (params) => api.get('/messages', { params }),
  markAsRead: (id) => api.post(`/messages/${id}/read`),
  markAllAsRead: () => api.post('/messages/read-all'),
}

export default api
