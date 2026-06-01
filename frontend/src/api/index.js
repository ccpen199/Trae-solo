import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const employeesAPI = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  addCertificate: (id, data) => api.post(`/employees/${id}/certificates`, data),
  addSkill: (id, data) => api.post(`/employees/${id}/skills`, data),
  getWarnings: (id) => api.get(`/employees/${id}/certificates/warnings`)
}

export const positionsAPI = {
  list: () => api.get('/positions'),
  get: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post('/positions', data),
  delete: (id) => api.delete(`/positions/${id}`),
  addRequirement: (id, data) => api.post(`/positions/${id}/requirements`, data)
}

export const trainingAPI = {
  courses: () => api.get('/training/courses'),
  createCourse: (data) => api.post('/training/courses', data),
  records: (params) => api.get('/training/records', { params }),
  createRecord: (data) => api.post('/training/records', data),
  updateRecord: (id, data) => api.put(`/training/records/${id}`, data),
  exams: (params) => api.get('/training/exams', { params }),
  createExam: (data) => api.post('/training/exams', data),
  updateExam: (id, data) => api.put(`/training/exams/${id}`, data)
}

export const authAPI = {
  list: (params) => api.get('/authorizations', { params }),
  create: (data) => api.post('/authorizations', data),
  update: (id, data) => api.put(`/authorizations/${id}`, data),
  delete: (id) => api.delete(`/authorizations/${id}`),
  schedules: (params) => api.get('/authorizations/schedules', { params }),
  createSchedule: (data) => api.post('/authorizations/schedules', data),
  checkSchedule: (id) => api.post(`/authorizations/schedules/${id}/check`),
  auditSummary: () => api.get('/authorizations/audit/summary')
}

export default api
