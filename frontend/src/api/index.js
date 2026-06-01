import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

export const issuesAPI = {
  list: (params) => api.get('/issues', { params }),
  get: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  assign: (id, data) => api.put(`/issues/${id}/assign`, data),
  reassign: (id, data) => api.put(`/issues/${id}/reassign`, data),
  fix: (id, data) => api.put(`/issues/${id}/fix`, data),
  reject: (id, data) => api.put(`/issues/${id}/reject`, data),
  verify: (id, data) => api.put(`/issues/${id}/verify`, data),
  close: (id, data) => api.put(`/issues/${id}/close`, data),
  stats: () => api.get('/issues/stats/summary')
}

export const orgsAPI = {
  list: () => api.get('/organizations'),
  issues: (id) => api.get(`/organizations/${id}/issues`)
}

export const healthCheck = () => axios.get(`${API_BASE}/health`)

export default api
