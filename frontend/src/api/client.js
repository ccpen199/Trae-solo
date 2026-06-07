import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password, role) => apiClient.post('/auth/login', { email, password, role }),
  register: (data) => apiClient.post('/auth/register', data),
  getProfile: () => apiClient.get('/auth/profile'),
  verify2FA: (secondFactorCode) => apiClient.post('/auth/2fa/verify', { secondFactorCode }),
}

export const socialSecurityAPI = {
  getPolicies: () => apiClient.get('/social-security/policies'),
  getPolicy: (cityCode) => apiClient.get(`/social-security/policies/${cityCode}`),
  calculate: (data) => apiClient.post('/social-security/calculate', data),
  getRecords: () => apiClient.get('/social-security/records'),
}

export const aiAPI = {
  startInterview: (position) => apiClient.post('/ai/interview/start', { position }),
  sendInterviewMessage: (data) => apiClient.post('/ai/interview/message', data),
  getInterviewSessions: () => apiClient.get('/ai/interview/sessions'),
  analyzeResume: (content) => apiClient.post('/ai/resume/analyze', { content }),
}

export const complianceAPI = {
  searchLaw: (keyword) => apiClient.get('/compliance/law/search', { params: { keyword } }),
  getArticles: (category) => apiClient.get('/compliance/law/articles', { params: { category } }),
  scanContract: (data) => apiClient.post('/compliance/contract/scan', data),
  getContractScans: () => apiClient.get('/compliance/contract/scans'),
  askLawyer: (question) => apiClient.post('/compliance/law/ask', { question }),
}

export const enterpriseAPI = {
  getDashboard: () => apiClient.get('/enterprise/dashboard'),
  getEmployees: (params) => apiClient.get('/enterprise/employees', { params }),
  createEmployee: (data) => apiClient.post('/enterprise/employees', data),
  updateEmployee: (id, data) => apiClient.put(`/enterprise/employees/${id}`, data),
  getAlerts: (isRead) => apiClient.get('/enterprise/alerts', { params: { isRead } }),
  markAlertRead: (id) => apiClient.put(`/enterprise/alerts/${id}/read`),
  runComplianceCheck: () => apiClient.post('/enterprise/compliance/check', { secondFactorCode: '123456' }),
  getComplianceReports: () => apiClient.get('/enterprise/compliance/reports'),
  getHeatmap: () => apiClient.get('/enterprise/heatmap'),
}

export const mallAPI = {
  getProducts: (params) => apiClient.get('/mall/products', { params }),
  getProduct: (id) => apiClient.get(`/mall/products/${id}`),
  createOrder: (productId, quantity, secondFactorCode) => 
    apiClient.post('/mall/orders', { productId, quantity, secondFactorCode }),
  getOrders: () => apiClient.get('/mall/orders'),
  getCodes: (status) => apiClient.get('/mall/codes', { params: { status } }),
  redeemCode: (code) => apiClient.post('/mall/redeem', { code }),
  getExpiringSoon: () => apiClient.get('/mall/expire-soon'),
}

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  createPolicy: (data) => apiClient.post('/admin/policies', { ...data, secondFactorCode: '123456' }),
  createProduct: (data) => apiClient.post('/admin/products', { ...data, secondFactorCode: '123456' }),
  updateProduct: (id, data) => apiClient.put(`/admin/products/${id}`, { ...data, secondFactorCode: '123456' }),
  getAudienceRules: () => apiClient.get('/admin/audience-rules'),
  getAudiencePreview: (productId) => apiClient.get('/admin/audience-preview', { params: { productId } }),
  getRedemptionCodes: (params) => apiClient.get('/admin/redemption-codes', { params }),
  redeemCodeAdmin: (code) => apiClient.post(`/admin/redemption-codes/${code}/redeem`, { secondFactorCode: '123456' }),
  getExpiringItems: (days) => apiClient.get('/admin/expiring-items', { params: { days } }),
  batchExpire: (type, ids) => apiClient.post('/admin/expire-batch', { type, ids, secondFactorCode: '123456' }),
  getAuditReviews: (params) => apiClient.get('/admin/audit-reviews', { params }),
  reviewAudit: (id, data) => apiClient.put(`/admin/audit-reviews/${id}/review`, { ...data, secondFactorCode: '123456' }),
}

export default apiClient
