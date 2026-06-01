import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const healthCheck = () => api.get('/health')
export const getCurrentUser = () => api.get('/users/me')

export const listEntries = (params) => api.get('/entries', { params })
export const getEntry = (id) => api.get(`/entries/${id}`)
export const createEntry = (data) => api.post('/entries', data)
export const updateEntry = (id, data) => api.put(`/entries/${id}`, data)
export const deleteEntry = (id) => api.delete(`/entries/${id}`)
export const searchEntries = (params) => api.get('/entries/search', { params })
export const getRelatedEntries = (id) => api.get(`/entries/${id}/related`)
export const getEntryVersions = (id) => api.get(`/entries/${id}/versions`)

export const listTags = () => api.get('/tags')

export const registerDevice = (data) => api.post('/devices', data)
export const syncData = (data) => api.post('/sync', data)

export const listConflicts = (params) => api.get('/conflicts', { params })
export const resolveConflict = (id, data) => api.post(`/conflicts/${id}/resolve`, data)

export const listShares = () => api.get('/shares')
export const createShare = (data) => api.post('/shares', data)
export const deactivateShare = (id) => api.delete(`/shares/${id}`)
export const getPublicShare = (token) => api.get(`/shares/public/${token}`)

export const listReviews = (params) => api.get('/reviews', { params })
export const createReview = (data) => api.post('/reviews', data)
export const updateReviewStatus = (id, status) => api.put(`/reviews/${id}/status?status=${status}`)

export const getStats = () => api.get('/stats')
export const getOperationLogs = (limit = 100) => api.get('/admin/logs', { params: { limit } })
export const getAdminStats = () => api.get('/admin/stats')

export default api
