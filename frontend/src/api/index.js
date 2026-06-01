import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const fleetsAPI = {
  list: () => api.get('/fleets'),
  create: (data) => api.post('/fleets', data),
  update: (id, data) => api.put(`/fleets/${id}`, data),
  delete: (id) => api.delete(`/fleets/${id}`)
}

export const crewAPI = {
  list: (params) => api.get('/crew', { params }),
  get: (id) => api.get(`/crew/${id}`),
  create: (data) => api.post('/crew', data),
  update: (id, data) => api.put(`/crew/${id}`, data),
  delete: (id) => api.delete(`/crew/${id}`),
  addQualification: (id, data) => api.post(`/crew/${id}/qualifications`, data),
  addVacation: (id, data) => api.post(`/crew/${id}/vacations`, data),
  addTraining: (id, data) => api.post(`/crew/${id}/trainings`, data),
  deleteQualification: (id) => api.delete(`/crew/qualifications/${id}`),
  deleteVacation: (id) => api.delete(`/crew/vacations/${id}`),
  getSchedulingInfo: (id) => api.get(`/crew/${id}/scheduling-info`),
  getSchedulingReviews: (id) => api.get(`/crew/${id}/scheduling-reviews`),
  addSchedulingReview: (id, data) => api.post(`/crew/${id}/scheduling-reviews`, data)
}

export const trainsAPI = {
  list: () => api.get('/trains'),
  get: (id) => api.get(`/trains/${id}`),
  create: (data) => api.post('/trains', data),
  update: (id, data) => api.put(`/trains/${id}`, data),
  delete: (id) => api.delete(`/trains/${id}`),
  addRequirement: (id, data) => api.post(`/trains/${id}/requirements`, data),
  deleteRequirement: (id) => api.delete(`/trains/requirements/${id}`),
  listRoutes: () => api.get('/trains/routes/list'),
  createRoute: (data) => api.post('/trains/routes', data)
}

export const schedulingAPI = {
  getAvailableCrew: (params) => api.get('/scheduling/available-crew', { params }),
  generate: (data) => api.post('/scheduling/generate', data),
  confirm: (data) => api.post('/scheduling/confirm', data),
  listSchedules: (params) => api.get('/scheduling/schedules', { params }),
  getSchedule: (id) => api.get(`/scheduling/schedules/${id}`),
  deleteSchedule: (id) => api.delete(`/scheduling/schedules/${id}`)
}

export const shiftChangesAPI = {
  list: (params) => api.get('/shift-changes', { params }),
  get: (id) => api.get(`/shift-changes/${id}`),
  create: (data) => api.post('/shift-changes', data),
  approve: (id) => api.post(`/shift-changes/${id}/approve`),
  reject: (id, data) => api.post(`/shift-changes/${id}/reject`, data)
}

export const reportsAPI = {
  summary: () => api.get('/reports/summary'),
  workload: (params) => api.get('/reports/workload', { params }),
  coverage: (params) => api.get('/reports/coverage', { params }),
  shortageRisk: () => api.get('/reports/shortage-risk'),
  shortageRiskDetail: (params) => api.get('/reports/shortage-risk-detail', { params }),
  shiftChanges: (params) => api.get('/reports/shift-changes', { params }),
  violations: (params) => api.get('/reports/violations', { params }),
  violationReviews: (params) => api.get('/reports/violation-reviews', { params }),
  reviewViolation: (id, data) => api.post(`/reports/violations/${id}/review`, data),
  statisticsCaliber: (params) => api.get('/reports/statistics-caliber', { params }),
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  verifyExport: (data) => api.post('/reports/export/verify', data)
}

export default api
