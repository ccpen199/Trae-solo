import axios from 'axios'
import { useAuthStore } from '../store'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
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
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

export const transactionApi = {
  getList: (params) => api.get('/transactions', { params }),
  getStats: (params) => api.get('/transactions/stats', { params }),
  getDetail: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  transitionToPayment: (id, data) => api.post(`/transactions/${id}/transition-to-payment`, data),
  processPayment: (id, data) => api.post(`/transactions/${id}/process-payment`, data),
  processExchange: (id, data) => api.post(`/transactions/${id}/process-exchange`, data),
  processCompliance: (id, data) => api.post(`/transactions/${id}/process-compliance`, data),
  processSettlement: (id, data) => api.post(`/transactions/${id}/process-settlement`, data),
  handleException: (id, data) => api.post(`/transactions/${id}/handle-exception`, data),
  getWorkflowNodes: () => api.get('/transactions/workflow-nodes'),
}

export const commonApi = {
  getExchangeRates: (params) => api.get('/common/exchange-rates', { params }),
  getPaymentInstitutions: () => api.get('/common/payment-institutions'),
  getMerchants: () => api.get('/common/merchants'),
  getTodos: (params) => api.get('/common/todos', { params }),
  updateTodo: (id, data) => api.patch(`/common/todos/${id}`, data),
  getMessages: (params) => api.get('/common/messages', { params }),
  markMessageRead: (id) => api.patch(`/common/messages/${id}/read`),
  getAuditLogs: (params) => api.get('/common/audit-logs', { params }),
  getRoles: () => api.get('/common/roles'),
  getUsers: () => api.get('/common/users'),
}

export default api
