import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

let currentUser = {
  id: 'mock-user-1',
  username: 'accountant',
  name: '张会计',
  role: 'accountant'
}

api.interceptors.request.use(config => {
  config.headers['X-User-Id'] = currentUser.id
  config.headers['X-User-Name'] = currentUser.name
  config.headers['X-User-Role'] = currentUser.role
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API 错误:', error)
    return Promise.reject(error)
  }
)

export function setUser(user) {
  currentUser = user
}

export function getCurrentUser() {
  return currentUser
}

export default {
  getHealth: () => api.get('/health'),
  
  login: (data) => api.post('/login', data),
  getUsers: () => api.get('/users'),

  getSubjects: (params) => api.get('/subjects', { params }),
  getSubject: (id) => api.get(`/subjects/${id}`),

  getVouchers: (params) => api.get('/vouchers', { params }),
  getVoucher: (id) => api.get(`/vouchers/${id}`),
  createVoucher: (data) => api.post('/vouchers', data),
  updateVoucher: (id, data) => api.put(`/vouchers/${id}`, data),
  deleteVoucher: (id) => api.delete(`/vouchers/${id}`),
  submitVoucher: (id) => api.post(`/vouchers/${id}/submit`),
  cancelVoucher: (id, data) => api.post(`/vouchers/${id}/cancel`, data),

  lockVoucher: (id) => api.post(`/vouchers/${id}/lock`),
  unlockVoucher: (id) => api.post(`/vouchers/${id}/unlock`),
  passReview: (id, data) => api.post(`/vouchers/${id}/review/pass`, data),
  rejectReview: (id, data) => api.post(`/vouchers/${id}/review/reject`, data),
  supplementReview: (id, data) => api.post(`/vouchers/${id}/review/supplement`, data),
  transferReview: (id, data) => api.post(`/vouchers/${id}/review/transfer`, data),

  generateLedger: (id) => api.post(`/vouchers/${id}/ledger`),
  getLedgers: (params) => api.get('/ledgers', { params }),
  getSubjectLedger: (subjectId, params) => api.get(`/ledgers/subject/${subjectId}`, { params }),

  generateReport: (id) => api.post(`/vouchers/${id}/report`),
  generateBalanceSheet: (data) => api.post('/reports/balance-sheet', data),
  getBalanceSheet: (period) => api.get(`/reports/balance-sheet/${period}`),
  generateProfitSheet: (data) => api.post('/reports/profit-sheet', data),
  getProfitSheet: (period) => api.get(`/reports/profit-sheet/${period}`),

  closeVoucher: (id) => api.post(`/vouchers/${id}/close`),
  uncloseVoucher: (id) => api.post(`/vouchers/${id}/unclose`),
  closePeriod: (period) => api.post(`/periods/${period}/close`),
  unclosePeriod: (period) => api.post(`/periods/${period}/unclose`),
  getPeriodStatus: (period) => api.get(`/periods/${period}/status`),

  getDashboardStats: (params) => api.get('/dashboard/stats', { params })
}
