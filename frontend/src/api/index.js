import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:58918/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const pathwayAPI = {
  getAll: (status) => api.get('/pathways', { params: { status } }),
  getById: (id) => api.get(`/pathways/${id}`),
  create: (data) => api.post('/pathways', data),
  addDrug: (id, data) => api.post(`/pathways/${id}/drugs`, data),
  publish: (id, data) => api.put(`/pathways/${id}/publish`, data),
}

export const patientAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
}

export const patientPathwayAPI = {
  getAll: () => api.get('/patient-pathways'),
  getById: (id) => api.get(`/patient-pathways/${id}`),
  create: (data) => api.post('/patient-pathways', data),
}

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  create: (data) => api.post('/orders', data),
  review: (id, data) => api.put(`/orders/${id}/review`, data),
}

export const adverseEventAPI = {
  getAll: () => api.get('/adverse-events'),
  create: (data) => api.post('/adverse-events', data),
}

export const efficacyFeedbackAPI = {
  getAll: () => api.get('/efficacy-feedback'),
  create: (data) => api.post('/efficacy-feedback', data),
}

export const qualityControlAPI = {
  getSummary: () => api.get('/quality-control/summary'),
}

export const auditLogAPI = {
  getAll: () => api.get('/audit-logs'),
  create: (data) => api.post('/audit-logs', data),
}

export default api
