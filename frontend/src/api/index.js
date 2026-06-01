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

export default {
  health: () => api.get('/health'),
  
  getUnits: (params) => api.get('/units', { params }),
  getUnit: (id) => api.get(`/units/${id}`),
  createUnit: (data) => api.post('/units', data),
  updateUnit: (id, data) => api.put(`/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/units/${id}`),
  
  getInspectionRecords: (params) => api.get('/inspection-records', { params }),
  createInspectionRecord: (data) => api.post('/inspection-records', data),
  
  getHazards: (params) => api.get('/hazards', { params }),
  updateHazardStatus: (id, status) => api.put(`/hazards/${id}/status`, { status }),
  
  getRectifications: (params) => api.get('/rectifications', { params }),
  createRectification: (data) => api.post('/rectifications', data),
  updateRectification: (id, data) => api.put(`/rectifications/${id}`, data),
  getOverdueRectifications: () => api.get('/rectifications/overdue'),
  
  getRechecks: (params) => api.get('/rechecks', { params }),
  createRecheck: (data) => api.post('/rechecks', data),
  
  getDashboardStats: () => api.get('/dashboard/stats'),
  getHazardTrend: () => api.get('/dashboard/hazard-trend')
}
