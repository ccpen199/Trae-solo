import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
}

export const projectApi = {
  list: (status) => api.get('/projects', { params: { status } }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  approve: (id) => api.post(`/projects/${id}/approve`),
  addMilestone: (projectId, data) => api.post(`/projects/${projectId}/milestones`, data)
}

export const donationApi = {
  create: (data) => api.post('/donations', data),
  getMy: () => api.get('/donations/my'),
  track: (trackId) => api.get(`/donations/track/${trackId}`)
}

export const taskApi = {
  create: (data) => api.post('/tasks', data),
  getMy: () => api.get('/tasks/my'),
  assign: (taskId, data) => api.post(`/tasks/${taskId}/assign`, data),
  uploadVoucher: (taskId, data) => api.post(`/tasks/${taskId}/upload`, data),
  approve: (taskId) => api.post(`/tasks/${taskId}/approve`)
}

export const auditApi = {
  create: (data) => api.post('/audits', data),
  complete: (auditId, data) => api.post(`/audits/${auditId}/complete`, data),
  getWhitePaper: (wpId) => api.get(`/white-papers/${wpId}`),
  getLogs: () => api.get('/audit-logs')
}

export const statsApi = {
  get: () => api.get('/stats')
}

export default api
