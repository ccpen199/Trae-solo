import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
}

export const masterApi = {
  getVerification: () => api.get('/master/verification'),
  submitVerification: (data) => api.post('/master/verification', data),
  getProfile: () => api.get('/master/profile'),
  getOrders: (status) => api.get('/master/orders', { params: { status } }),
  acceptOrder: (id) => api.post(`/master/orders/${id}/accept`),
  startOrder: (id) => api.post(`/master/orders/${id}/start`),
  completeOrder: (id, data) => api.post(`/master/orders/${id}/complete`, data),
  getServiceHistory: () => api.get('/master/service-history'),
  getStatistics: () => api.get('/master/statistics')
}

export const ownerApi = {
  createOrder: (data) => api.post('/owner/orders', data),
  getOrders: (status) => api.get('/owner/orders', { params: { status } }),
  getOrderDetail: (id) => api.get(`/owner/orders/${id}`),
  getAvailableMasters: () => api.get('/owner/available-masters'),
  assignMaster: (id, masterId) => api.post(`/owner/orders/${id}/assign-master`, { master_id: masterId }),
  negotiate: (id, data) => api.post(`/owner/orders/${id}/negotiate`, data),
  acceptPrice: (id, negotiationId) => api.post(`/owner/orders/${id}/accept-price`, { negotiation_id: negotiationId }),
  payDeposit: (id) => api.post(`/owner/orders/${id}/pay-deposit`),
  payBalance: (id) => api.post(`/owner/orders/${id}/pay-balance`),
  acceptOrder: (id, data) => api.post(`/owner/orders/${id}/accept`, data),
  reviewOrder: (id, data) => api.post(`/owner/orders/${id}/review`, data),
  getServiceStandards: () => api.get('/owner/service-standards'),
  getKnowledgeGraph: (faultType) => api.get('/owner/knowledge-graph', { params: { fault_type: faultType } })
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getVerifications: (status) => api.get('/admin/verifications', { params: { status } }),
  approveVerification: (id) => api.post(`/admin/verifications/${id}/approve`),
  rejectVerification: (id) => api.post(`/admin/verifications/${id}/reject`),
  getDisputes: (status) => api.get('/admin/disputes', { params: { status } }),
  handleDispute: (id, result) => api.post(`/admin/disputes/${id}/handle`, { result }),
  getMasterDensity: () => api.get('/admin/master-density'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getMasters: () => api.get('/admin/masters'),
  getKnowledgeGraph: () => api.get('/admin/knowledge-graph'),
  addKnowledge: (data) => api.post('/admin/knowledge-graph', data)
}

export default api
