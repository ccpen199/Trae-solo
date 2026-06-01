import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.hash = '#/login'
    }
    const msg = err.response?.data?.message || err.message || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export default api

export const AuthAPI = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
}

export const DashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  timeline: () => api.get('/dashboard/timeline')
}

export const AppAPI = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  remove: (id) => api.delete(`/applications/${id}`),
  listEnvs: (id) => api.get(`/applications/${id}/environments`),
  createEnv: (id, data) => api.post(`/applications/${id}/environments`, data),
  removeEnv: (eid) => api.delete(`/applications/environments/${eid}`),
  listVersions: (id) => api.get(`/applications/${id}/versions`),
  createVersion: (id, data) => api.post(`/applications/${id}/versions`, data),
  listSecrets: (id) => api.get(`/applications/${id}/secrets`),
  createSecret: (id, data) => api.post(`/applications/${id}/secrets`, data),
  removeSecret: (sid) => api.delete(`/applications/secrets/${sid}`)
}

export const ConfigAPI = {
  list: (params) => api.get('/configs', { params }),
  get: (id) => api.get(`/configs/${id}`),
  create: (data) => api.post('/configs', data),
  update: (id, data) => api.put(`/configs/${id}`, data),
  remove: (id) => api.delete(`/configs/${id}`),
  revert: (id, version) => api.post(`/configs/${id}/revert/${version}`)
}

export const TaskAPI = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  submit: (id) => api.post(`/tasks/${id}/submit`),
  execute: (id) => api.post(`/tasks/${id}/execute`),
  review: (id, data) => api.post(`/tasks/${id}/review`, data),
  close: (id, data) => api.post(`/tasks/${id}/close`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
  pendingReview: () => api.get('/tasks/pending/review')
}

export const LogAPI = {
  list: (params) => api.get('/logs', { params }),
  get: (id) => api.get(`/logs/${id}`),
  summary: () => api.get('/logs/stats/summary')
}

export const OrderAPI = {
  list: (params) => api.get('/change-orders', { params }),
  get: (id) => api.get(`/change-orders/${id}`),
  create: (data) => api.post('/change-orders', data),
  update: (id, data) => api.put(`/change-orders/${id}`, data),
  submit: (id) => api.post(`/change-orders/${id}/submit`),
  approve: (id) => api.post(`/change-orders/${id}/approve`),
  reject: (id, data) => api.post(`/change-orders/${id}/reject`, data),
  execute: (id) => api.post(`/change-orders/${id}/execute`),
  close: (id, data) => api.post(`/change-orders/${id}/close`, data),
  remove: (id) => api.delete(`/change-orders/${id}`),
  pendingReview: () => api.get('/change-orders/pending/review')
}

export const AlertAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  handle: (id, data) => api.post(`/alerts/${id}/handle`, data),
  close: (id, data) => api.post(`/alerts/${id}/close`, data),
  remove: (id) => api.delete(`/alerts/${id}`)
}

export const AuditAPI = {
  list: (params) => api.get('/audits', { params }),
  export: () => window.open(`${api.defaults.baseURL}/audits/export?token=${localStorage.getItem('token') || ''}`, '_blank'),
  users: () => api.get('/audits/users'),
  toggleUser: (id) => api.post(`/audits/users/${id}/toggle-status`),
  permissions: () => api.get('/audits/permissions')
}

export const CatalogAPI = {
  list: (params) => api.get('/catalog', { params }),
  get: (id) => api.get(`/catalog/${id}`),
  visit: (id) => api.post(`/catalog/${id}/visit`),
  toggleFavorite: (id) => api.post(`/catalog/${id}/favorite`),
  getFavorites: () => api.get('/catalog/me/favorites'),
  getRecent: () => api.get('/catalog/me/recent'),
  getAnnouncements: () => api.get('/catalog/announcements/list')
}

export const PermissionAPI = {
  list: (params) => api.get('/permissions', { params }),
  getMine: () => api.get('/permissions/me'),
  getPending: () => api.get('/permissions/pending'),
  getExpiringSoon: () => api.get('/permissions/expiring-soon'),
  create: (data) => api.post('/permissions', data),
  approve: (id, data) => api.post(`/permissions/${id}/approve`, data),
  reject: (id, data) => api.post(`/permissions/${id}/reject`, data),
  cancel: (id) => api.post(`/permissions/${id}/cancel`)
}
