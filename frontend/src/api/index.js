import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data || error)
  }
)

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
}

export const applicationsApi = {
  list: () => api.get('/applications'),
  get: (id) => api.get(`/applications/${id}`),
  create: (formData) => api.post('/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadAttachments: (id, formData) => api.put(`/applications/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const auditApi = {
  approve: (id, data) => api.post(`/audit/${id}/approve`, data),
  reject: (id, data) => api.post(`/audit/${id}/reject`, data),
  return: (id, data) => api.post(`/audit/${id}/return`, data),
  history: (id) => api.get(`/audit/${id}/history`)
}

export const paymentApi = {
  execute: (id, data) => api.post(`/payment/${id}/execute`, data),
  retry: (id) => api.post(`/payment/${id}/retry`),
  receipts: () => api.get('/payment/receipts'),
  performance: () => api.get('/payment/performance'),
  performanceDetail: (projectId) => api.get(`/payment/performance/${projectId}`)
}

export default api
