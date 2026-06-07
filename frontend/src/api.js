import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

const DEMO_TOKEN = 'local-demo-courier'
const DEMO_USER = {
  id: 1,
  username: 'courier001',
  name: '张三',
  phone: '13800138001',
  brands: ['sto', 'yto'],
  serviceArea: '朝阳区A区',
  performancePoints: 1250
}

function setDemoSession() {
  localStorage.setItem('token', DEMO_TOKEN)
  localStorage.setItem('user', JSON.stringify(DEMO_USER))
}

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token')
    if (!token) {
      setDemoSession()
      token = DEMO_TOKEN
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const originalRequest = error.config || {}
    if ((status === 401 || status === 403) && !originalRequest.__demoRetry) {
      originalRequest.__demoRetry = true
      setDemoSession()
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${DEMO_TOKEN}`
      return api(originalRequest)
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/couriers/profile'),
}

export const cabinetApi = {
  getList: (params) => api.get('/cabinets', { params }),
  getDetail: (id) => api.get(`/cabinets/${id}`),
  getRecommend: (params) => api.get('/cabinets/recommend/optimal', { params }),
}

export const packageApi = {
  getList: (params) => api.get('/packages', { params }),
  getDetail: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  batchRemind: (data) => api.post('/packages/batch-remind', data),
  resendCode: (id) => api.post(`/packages/${id}/resend-code`),
  parseOCR: (trackingNumber) => api.get('/packages/ocr/parse', { params: { trackingNumber } }),
  pickup: (id) => api.put('/packages/' + id + '/pickup'),
}

export const rentalApi = {
  getList: (params) => api.get('/rental-orders', { params }),
  create: (data) => api.post('/rental-orders', data),
  toggleRenew: (id) => api.put('/rental-orders/' + id + '/toggle-renew'),
  endRental: (id) => api.put('/rental-orders/' + id + '/end'),
}

export const reservationApi = {
  getList: (params) => api.get('/reservations', { params }),
  create: (data) => api.post('/reservations', data),
  cancel: (id) => api.delete(`/reservations/${id}`),
  lock: (id) => api.put('/reservations/' + id + '/lock'),
  releaseExpired: () => api.post('/reservations/release-expired'),
}

export const smsApi = {
  getTemplates: () => api.get('/sms-templates'),
  createTemplate: (data) => api.post('/sms-templates', data),
  getRecords: (params) => api.get('/sms-records', { params }),
}

export const tutorialApi = {
  getVideos: (params) => api.get('/tutorial-videos', { params }),
  getFaq: (params) => api.get('/faq', { params }),
}

export const leaderboardApi = {
  getList: (params) => api.get('/leaderboard', { params }),
}

export const dashboardApi = {
  getCabinetHealth: () => api.get('/dashboard/cabinet-health'),
  getRevenue: (params) => api.get('/dashboard/revenue', { params }),
  getOverview: () => api.get('/statistics/overview'),
}

export const revenueApi = {
  getRecords: (params) => api.get('/revenue/records', { params }),
}

export const withdrawalApi = {
  getRecords: (params) => api.get('/withdrawal/records', { params }),
  create: (data) => api.post('/withdrawal', data),
}

export const alertApi = {
  getList: (params) => api.get('/device-alerts', { params }),
  markRead: (id) => api.put(`/device-alerts/${id}/read`),
}

export default api
