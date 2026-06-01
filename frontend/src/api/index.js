import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const generateReport = (data) => api.post('/reports/generate', data)
export const regenerateReport = (reportNo, accountManager) => api.post(`/reports/${reportNo}/regenerate`, { accountManager })
export const exportReport = (id, exportedBy) => api.post(`/reports/${id}/export`, { exportedBy })
export const getReport = (id) => api.get(`/reports/${id}`)
export const getReports = () => api.get('/reports')
export const getQueries = () => api.get('/queries')
export const getAuditLogs = () => api.get('/audit')
export const getDataSources = () => api.get('/datasources')

export default api
