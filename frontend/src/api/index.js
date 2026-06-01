import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats')
}

export const orderApi = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  match: (id) => api.post(`/orders/${id}/match`),
  getCandidates: (id) => api.get(`/orders/${id}/match-candidates`),
  pickup: (id) => api.post(`/orders/${id}/pickup`),
  deliver: (id) => api.post(`/orders/${id}/deliver`),
  track: (id, data) => api.post(`/orders/${id}/track`, data),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
  sign: (id, data) => api.post(`/orders/${id}/sign`, data),
  getSignature: (id) => api.get(`/orders/${id}/signature`),
  timeoutCheck: (id, force = false) => api.post(`/orders/${id}/timeout-check`, { force })
}

export const riderApi = {
  list: () => api.get('/riders'),
  get: (id) => api.get(`/riders/${id}`),
  updateLocation: (id, data) => api.post(`/riders/${id}/location`, data)
}

export const complaintApi = {
  create: (data) => api.post('/complaints', data)
}

export const enterpriseApi = {
  getConfigs: () => api.get('/enterprise/configs')
}

export const archiveApi = {
  list: () => api.get('/archives')
}

export default api
