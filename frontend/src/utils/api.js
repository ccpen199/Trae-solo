import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 30000
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username, password) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/token', formData)
  },
  getCurrentUser: () => api.get('/users/me')
}

export const documentAPI = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  approve: (id) => api.post(`/documents/${id}/approve`)
}

export const qaAPI = {
  ask: (question) => api.post('/qa/ask', { question })
}

export const taskAPI = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  approve: (id, remark) => api.post(`/tasks/${id}/approve`, null, { params: { remark } }),
  reject: (id, remark) => api.post(`/tasks/${id}/reject`, null, { params: { remark } })
}

export const feedbackAPI = {
  list: (params) => api.get('/feedbacks', { params }),
  create: (data) => api.post('/feedbacks', data),
  collect: (id) => api.post(`/feedbacks/${id}/collect`)
}

export const exceptionAPI = {
  list: (params) => api.get('/exceptions', { params }),
  resolve: (id, manualNote) => api.post(`/exceptions/${id}/resolve`, null, { params: { manual_note: manualNote } })
}

export const reportAPI = {
  tasksSummary: (params) => api.get('/reports/tasks-summary', { params })
}

export const exportAPI = {
  exportTasks: (params) => api.get('/export/tasks', { params, responseType: 'blob' })
}

export const auditAPI = {
  list: (params) => api.get('/audit-logs', { params })
}

export const ruleAPI = {
  list: (params) => api.get('/rules', { params }),
  create: (data) => api.post('/rules', data)
}

export const userAPI = {
  list: (params) => api.get('/users', { params })
}

export default api
