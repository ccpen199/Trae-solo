import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:59032/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.error || '请求失败'
      
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('没有权限访问该资源')
      } else if (status === 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error(message)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    }
    
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

export const brandAPI = {
  getList: (params) => api.get('/brands', { params }),
  getFilters: () => api.get('/brands/filters'),
  getDetail: (id) => api.get(`/brands/${id}`),
  vote: (id, data) => api.post(`/brands/${id}/vote`, data),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
  collect: (id) => api.post(`/brands/${id}/collect`),
  getTraceability: (id) => api.get(`/brands/${id}/traceability`)
}

export const rankingAPI = {
  getCategories: (params) => api.get('/rankings/categories', { params }),
  getRankings: (categoryId, params) => api.get(`/rankings/${categoryId}`, { params }),
  calculate: (categoryId, data) => api.post(`/rankings/${categoryId}/calculate`, data),
  compare: (data) => api.post('/rankings/compare', data),
  getCompareHistory: (params) => api.get('/rankings/compare/history', { params }),
  getCompareDetail: (id) => api.get(`/rankings/compare/${id}`),
  expertReview: (rankingId, data) => api.post(`/rankings/${rankingId}/expert-review`, data),
  generateReport: (categoryId, data) => api.post(`/rankings/${categoryId}/report`, data),
  getReports: (params) => api.get('/rankings/reports/list', { params }),
  getReportDetail: (id) => api.get(`/rankings/reports/${id}`)
}

export const knowledgeAPI = {
  getList: (params) => api.get('/knowledge', { params }),
  getCategories: () => api.get('/knowledge/categories'),
  getDetail: (id) => api.get(`/knowledge/${id}`),
  create: (data) => api.post('/knowledge', data),
  update: (id, data) => api.put(`/knowledge/${id}`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
  like: (id) => api.post(`/knowledge/${id}/like`),
  getGraph: (id) => api.get(`/knowledge/${id}/graph`),
  getGlobalGraph: () => api.get('/knowledge/graph/global'),
  getConceptHierarchy: (params) => api.get('/knowledge/concept/hierarchy', { params }),
  getAlerts: (params) => api.get('/knowledge/alerts', { params }),
  processAlert: (id) => api.put(`/knowledge/alerts/${id}/process`)
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDataSources: () => api.get('/admin/data-sources'),
  runCollection: () => api.post('/admin/data-collection/run'),
  collectBrand: (brandId) => api.post(`/admin/data-collection/brand/${brandId}`),
  getTraceability: (params) => api.get('/admin/data-traceability', { params }),
  checkUpdates: () => api.post('/admin/check-updates'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, data) => api.post(`/admin/users/${id}/role`, data),
  getExpertReviews: () => api.get('/admin/expert-reviews')
}

export const collectionAPI = {
  getList: (params) => api.get('/collections', { params }),
  add: (data) => api.post('/collections', data),
  remove: (data) => api.delete('/collections', { data }),
  check: (params) => api.get('/collections/check', { params })
}

export const statsAPI = {
  getStats: () => api.get('/stats'),
  getHealth: () => api.get('/health')
}

export default api
