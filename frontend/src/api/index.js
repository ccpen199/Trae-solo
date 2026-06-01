import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user-1'
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data || error)
  }
)

export const applications = {
  list: params => api.get('/applications', { params }),
  get: id => api.get(`/applications/${id}`),
  create: data => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  addEnv: (id, data) => api.post(`/applications/${id}/environments`, data)
}

export const configs = {
  list: params => api.get('/configs', { params }),
  get: id => api.get(`/configs/${id}`),
  create: data => api.post('/configs', data),
  requestChange: (id, data) => api.post(`/configs/${id}/change`, data),
  approveChange: id => api.post(`/configs/change/${id}/approve`),
  rejectChange: id => api.post(`/configs/change/${id}/reject`)
}

export const executions = {
  listTasks: params => api.get('/executions/tasks', { params }),
  getTask: id => api.get(`/executions/tasks/${id}`),
  createTask: data => api.post('/executions/tasks', data),
  retryTask: id => api.post(`/executions/tasks/${id}/retry`),
  listLogs: params => api.get('/executions/logs', { params }),
  getLog: id => api.get(`/executions/logs/${id}`)
}

export const audit = {
  logs: params => api.get('/audit/logs', { params }),
  exceptions: params => api.get('/audit/exceptions', { params }),
  handleException: (id, data) => api.post(`/audit/exceptions/${id}/handle`, data),
  alerts: params => api.get('/audit/alerts', { params }),
  acknowledgeAlert: id => api.post(`/audit/alerts/${id}/acknowledge`)
}

export const reports = {
  summary: params => api.get('/reports/summary', { params }),
  trends: params => api.get('/reports/trends', { params }),
  exportTasks: params => api.get('/reports/export/tasks', { params }),
  topFailures: params => api.get('/reports/top-failures', { params })
}

export const users = {
  me: () => api.get('/users/me'),
  list: () => api.get('/users'),
  getPermissions: id => api.get(`/users/${id}/permissions`),
  addPermission: (id, data) => api.post(`/users/${id}/permissions`, data)
}

export default api
