import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const platformApi = {
  list: (params) => api.get('/platforms', { params }),
  stats: () => api.get('/platforms/stats'),
  detail: (id) => api.get(`/platforms/${id}`),
  update: (id, data) => api.put(`/platforms/${id}`, data),
  updateCapacity: (id, saturation) => api.patch(`/platforms/${id}/capacity`, { capacity_saturation: saturation })
}

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  stats: (params) => api.get('/orders/stats', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  tracks: (id) => api.get(`/orders/${id}/tracks`),
  quote: (data) => api.post('/orders/quote', data),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason })
}

export const merchantApi = {
  list: () => api.get('/merchants'),
  detail: (id) => api.get(`/merchants/${id}`),
  create: (data) => api.post('/merchants', data),
  updateBalance: (id, amount, type) => api.put(`/merchants/${id}/balance`, { amount, type })
}

export const afterSalesApi = {
  list: (params) => api.get('/after-sales', { params }),
  create: (data) => api.post('/after-sales', data),
  stats: () => api.get('/after-sales/stats'),
  updateStatus: (id, status, result) => api.put(
    `/after-sales/${id}/status`,
    typeof status === 'object' ? status : { status, result }
  )
}

export const compensationApi = {
  list: (params) => api.get('/compensations', { params }),
  stats: () => api.get('/compensations/stats'),
  checkTimeout: () => api.post('/compensations/check-timeout'),
  manual: (data) => api.post('/compensations/manual', data),
  updateStatus: (id, status, result) => api.put(
    `/compensations/${id}/status`,
    typeof status === 'object' ? status : { status, result }
  )
}

export const settlementApi = {
  list: (params) => api.get('/settlements', { params }),
  detail: (id) => api.get(`/settlements/${id}`),
  monthlySummary: (params) => api.get('/settlements/summary/monthly', { params }),
  generate: (data) => api.post('/settlements/generate', data),
  updateStatus: (id, status) => api.put(`/settlements/${id}/status`, { status }),
  reconcile: (id, data) => api.post(`/settlements/${id}/reconcile`, data)
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary')
}

export default api
