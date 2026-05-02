import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      } else if (error.response.status === 403) {
        ElMessage.error('权限不足')
      } else if (error.response.status === 404) {
        ElMessage.error('资源不存在')
      } else {
        ElMessage.error(error.response.data?.error || '请求失败')
      }
    } else {
      ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
}

export const documentApi = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}/edit`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  submitReview: (id) => api.post(`/documents/${id}/submit-review`),
  review: (id, data) => api.post(`/documents/${id}/review`, data),
  searchUse: (id) => api.post(`/documents/${id}/search-use`),
  requestUpdate: (id, data) => api.post(`/documents/${id}/request-update`, data),
  updateReview: (id, data) => api.post(`/documents/${id}/update`, data),
  rollback: (id, data) => api.post(`/documents/${id}/rollback`, data),
  getConflicts: (id) => api.get(`/documents/${id}/conflicts`),
  resolveConflict: (id, data) => api.post(`/documents/${id}/resolve-conflict`, data)
}

export const directoryApi = {
  list: () => api.get('/directories'),
  get: (id) => api.get(`/directories/${id}`),
  create: (data) => api.post('/directories', data),
  update: (id, data) => api.put(`/directories/${id}`, data),
  delete: (id) => api.delete(`/directories/${id}`)
}

export const tagApi = {
  list: (params) => api.get('/tags', { params }),
  get: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
  lock: (id) => api.post(`/tags/${id}/lock`),
  unlock: (id) => api.post(`/tags/${id}/unlock`),
  search: (data) => api.post('/tags/search', data)
}

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  me: () => api.get('/users/me'),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getRoles: () => api.get('/users/options/roles')
}

export const todoApi = {
  list: (params) => api.get('/todos', { params }),
  markRead: (id) => api.post(`/todos/${id}/read`),
  markComplete: (id) => api.post(`/todos/${id}/complete`),
  readAll: () => api.post('/todos/read-all')
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  documentsByStatus: (params) => api.get('/stats/documents-by-status', { params }),
  workflowOverview: () => api.get('/stats/workflow-overview'),
  myDocuments: () => api.get('/stats/my-documents')
}

export const auditApi = {
  list: (params) => api.get('/audit', { params }),
  getActions: () => api.get('/audit/actions'),
  getResourceTypes: () => api.get('/audit/resource-types'),
  getDocumentLogs: (id) => api.get(`/audit/document/${id}`)
}
