import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const tasksApi = {
  getList: (params) => api.get('/tasks', { params }),
  getDetail: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  publish: (id, data) => api.post(`/tasks/${id}/publish`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
}

export const executionApi = {
  getList: (params) => api.get('/execution', { params }),
  getDetail: (id) => api.get(`/execution/${id}`),
  getCoursePlans: (taskId, dealerId) => api.get(`/execution/course/${taskId}/${dealerId}`),
  addCoursePlan: (data) => api.post('/execution/course', data),
  updateCoursePlan: (id, data) => api.put(`/execution/course/${id}`, data),
  deleteCoursePlan: (id) => api.delete(`/execution/course/${id}`),
  getEnrollment: (taskId, dealerId) => api.get(`/execution/enrollment/${taskId}/${dealerId}`),
  saveEnrollment: (data) => api.post('/execution/enrollment', data),
  saveSubmission: (id, data) => api.put(`/execution/${id}/save`, data),
  submitSubmission: (id, data) => api.put(`/execution/${id}/submit`, data)
}

export const auditApi = {
  getList: (params) => api.get('/audit', { params }),
  getDetail: (id) => api.get(`/audit/${id}`),
  audit: (id, data) => api.put(`/audit/${id}/audit`, data),
  getExportData: (params) => api.get('/audit/export/list', { params })
}

export const dealersApi = {
  getList: (params) => api.get('/dealers', { params }),
  getRegions: () => api.get('/dealers/regions'),
  getPersonnel: (id) => api.get(`/dealers/${id}/personnel`),
  create: (data) => api.post('/dealers', data)
}

export const uploadApi = {
  uploadFile: (formData, config) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  uploadFiles: (formData, config) => api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  uploadVideo: (formData, config) => api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })
}

export default api
