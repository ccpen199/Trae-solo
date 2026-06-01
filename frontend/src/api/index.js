import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'X-User-Id': 1
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const appApi = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  batch: (data) => api.post('/applications/batch', data)
}

export const envApi = {
  list: (params) => api.get('/environments', { params }),
  create: (data) => api.post('/environments', data),
  update: (id, data) => api.put(`/environments/${id}`, data),
  delete: (id) => api.delete(`/environments/${id}`)
}

export const secretApi = {
  list: (params) => api.get('/secrets', { params }),
  create: (data) => api.post('/secrets', data),
  update: (id, data) => api.put(`/secrets/${id}`, data),
  delete: (id) => api.delete(`/secrets/${id}`),
  rotate: (id) => api.post(`/secrets/${id}/rotate`)
}

export const changeApi = {
  list: (params) => api.get('/change-orders', { params }),
  get: (id) => api.get(`/change-orders/${id}`),
  create: (data) => api.post('/change-orders', data),
  approve: (id) => api.post(`/change-orders/${id}/approve`),
  execute: (id) => api.post(`/change-orders/${id}/execute`)
}

export const taskApi = {
  list: (params) => api.get('/execution-tasks', { params }),
  create: (data) => api.post('/execution-tasks', data),
  execute: (id) => api.post(`/execution-tasks/${id}/execute`)
}

export const alertApi = {
  list: (params) => api.get('/alerts', { params }),
  assign: (id, data) => api.post(`/alerts/${id}/assign`, data),
  close: (id, data) => api.post(`/alerts/${id}/close`, data)
}

export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
  timeline: (params) => api.get('/audit-logs/timeline', { params })
}

export const userApi = {
  me: () => api.get('/users/me'),
  list: () => api.get('/users'),
  roles: () => api.get('/users/roles')
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  workbench: () => api.get('/dashboard/workbench')
}

export default api
