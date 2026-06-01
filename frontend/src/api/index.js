import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const buildings = {
  list: () => api.get('/buildings'),
  get: (id) => api.get(`/buildings/${id}`),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),
  addFloor: (id, data) => api.post(`/buildings/${id}/floors`, data),
  getFloors: (id) => api.get(`/buildings/${id}/floors`)
}

export const rooms = {
  list: (params) => api.get('/rooms', { params }),
  get: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  history: (id) => api.get(`/rooms/${id}/history`)
}

export const leads = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  checkDuplicate: (data) => api.post('/leads/check-duplicate', data),
  merge: (id, data) => api.post(`/leads/${id}/merge`, data),
  addFollowup: (id, data) => api.post(`/leads/${id}/followups`, data),
  getFollowups: (id) => api.get(`/leads/${id}/followups`)
}

export const viewings = {
  list: (params) => api.get('/viewings', { params }),
  get: (id) => api.get(`/viewings/${id}`),
  create: (data) => api.post('/viewings', data),
  update: (id, data) => api.put(`/viewings/${id}`, data),
  delete: (id) => api.delete(`/viewings/${id}`)
}

export const quotes = {
  list: (params) => api.get('/quotes', { params }),
  get: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  lock: (id) => api.post(`/quotes/${id}/lock`)
}

export const contracts = {
  list: (params) => api.get('/contracts', { params }),
  get: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  delete: (id) => api.delete(`/contracts/${id}`),
  approve: (id) => api.post(`/contracts/${id}/approve`),
  sign: (id, data) => api.post(`/contracts/${id}/sign`, data),
  checkin: (id, data) => api.post(`/contracts/${id}/checkin`, data),
  checkConflict: (data) => api.post('/contracts/check-conflict', data)
}

export const reports = {
  overview: () => api.get('/reports/overview'),
  buildingOccupancy: () => api.get('/reports/building-occupancy'),
  leadSource: () => api.get('/reports/lead-source'),
  monthlyContracts: () => api.get('/reports/monthly-contracts'),
  industryAnalysis: () => api.get('/reports/industry-analysis')
}

export const dashboard = {
  stats: () => api.get('/dashboard/stats')
}

export default api
