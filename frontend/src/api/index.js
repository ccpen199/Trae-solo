import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const baggageApi = {
  create: (data) => api.post('/baggage', data),
  list: (params) => api.get('/baggage', { params }),
  getByTag: (tag) => api.get(`/baggage/${tag}`),
  getFull: (tag) => api.get(`/baggage/${tag}/full`),
  updateStatus: (tag, status) => api.put(`/baggage/${tag}/status`, { status })
}

export const nodeApi = {
  create: (data) => api.post('/nodes', data),
  getByBaggage: (baggageId) => api.get(`/nodes/baggage/${baggageId}`),
  getAlerts: (hours = 24) => api.get('/nodes/alerts', { params: { hours } }),
  getTypes: () => api.get('/nodes/types')
}

export const exceptionApi = {
  create: (data) => api.post('/exceptions', data),
  list: (params) => api.get('/exceptions', { params }),
  getByInquiryNo: (inquiryNo) => api.get(`/exceptions/${inquiryNo}`),
  updateStatus: (inquiryNo, data) => api.put(`/exceptions/${inquiryNo}/status`, data),
  addProgress: (inquiryNo, data) => api.post(`/exceptions/${inquiryNo}/progress`, data),
  getProgress: (inquiryNo) => api.get(`/exceptions/${inquiryNo}/progress`),
  getTypes: () => api.get('/exceptions/types'),
  getStatuses: () => api.get('/exceptions/statuses')
}

export const compensationApi = {
  create: (data) => api.post('/compensation', data),
  list: (params) => api.get('/compensation', { params }),
  getById: (id) => api.get(`/compensation/${id}`),
  approve: (id, data) => api.put(`/compensation/${id}/approve`, data),
  reject: (id, data) => api.put(`/compensation/${id}/reject`, data),
  close: (id, data) => api.put(`/compensation/${id}/close`, data),
  getResponsibleParties: () => api.get('/compensation/meta/responsible-parties'),
  getStandards: () => api.get('/compensation/meta/standards'),
  getStatuses: () => api.get('/compensation/meta/statuses')
}

export const statsApi = {
  getOverview: (days = 30) => api.get('/stats/overview', { params: { days } }),
  getExceptionsByType: (days = 30) => api.get('/stats/exceptions-by-type', { params: { days } }),
  getExceptionsByRoute: (days = 30, top = 10) => api.get('/stats/exceptions-by-route', { params: { days, top } }),
  getExceptionsByNode: (days = 30) => api.get('/stats/exceptions-by-node', { params: { days } }),
  getCompensationByParty: (days = 30) => api.get('/stats/compensation-by-party', { params: { days } }),
  getDailyTrend: (days = 30) => api.get('/stats/daily-trend', { params: { days } }),
  getMissingNodes: (hours = 24) => api.get('/stats/missing-nodes', { params: { hours } })
}

export const uploadApi = {
  uploadPhotos: (inquiryNo, files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('photos', file))
    return api.post(`/upload/exception/${inquiryNo}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getPhotos: (inquiryNo) => api.get(`/upload/exception/${inquiryNo}`),
  deletePhoto: (photoId) => api.delete(`/upload/${photoId}`)
}

export const healthApi = {
  check: () => api.get('/health')
}

export default api
