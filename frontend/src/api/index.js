import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getCranes = () => api.get('/cranes')
export const getCrane = (id) => api.get(`/cranes/${id}`)
export const createCrane = (data) => api.post('/cranes', data)
export const updateCrane = (id, data) => api.put(`/cranes/${id}`, data)
export const deleteCrane = (id) => api.delete(`/cranes/${id}`)

export const getMonitorData = (params) => api.get('/monitor-data', { params })
export const getLatestMonitorData = () => api.get('/monitor-data/latest')
export const addMonitorData = (data) => api.post('/monitor-data', data)

export const getAlerts = (params) => api.get('/alerts', { params })
export const createAlert = (data) => api.post('/alerts', data)
export const handleAlert = (id, data) => api.put(`/alerts/${id}/handle`, data)

export const getMaintenance = (params) => api.get('/maintenance', { params })
export const createMaintenance = (data) => api.post('/maintenance', data)
export const updateMaintenance = (id, data) => api.put(`/maintenance/${id}`, data)

export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getHandleRecords = (alertId) => api.get(`/handle-records/${alertId}`)

export default api
