import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  update: (id, data) => api.put(`/students/${id}`, data),
}

export const schemeAPI = {
  getAll: () => api.get('/schemes'),
  getByStudent: (studentId) => api.get(`/schemes/student/${studentId}`),
  create: (data) => api.post('/schemes', data),
  update: (id, data) => api.put(`/schemes/${id}`, data),
  confirm: (id) => api.put(`/schemes/${id}/confirm`),
  delete: (id) => api.delete(`/schemes/${id}`),
}

export const essayAPI = {
  getByScheme: (schemeId) => api.get(`/essays/scheme/${schemeId}`),
  create: (data) => api.post('/essays', data),
  getVersions: (id) => api.get(`/essays/${id}/versions`),
  addVersion: (id, data) => api.post(`/essays/${id}/versions`, data),
  confirm: (id) => api.put(`/essays/${id}/confirm`),
}

export const materialAPI = {
  getByScheme: (schemeId) => api.get(`/materials/scheme/${schemeId}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
}

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  getByScheme: (schemeId) => api.get(`/applications/scheme/${schemeId}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  getStats: () => api.get('/applications/dashboard/stats'),
}

export default api
