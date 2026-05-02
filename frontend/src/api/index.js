import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error('权限不足')
      } else if (status === 404) {
        ElMessage.error('资源不存在')
      } else if (status >= 500) {
        ElMessage.error(data.error || '服务器错误')
      } else if (data.error) {
        ElMessage.error(data.error)
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

export const userApi = {
  getAll: () => api.get('/users')
}

export const caseApi = {
  create: (data) => api.post('/cases', data),
  getList: (params) => api.get('/cases', { params }),
  getDetail: (caseId) => api.get(`/cases/${caseId}`),
  updateStatus: (caseId, status) => api.put(`/cases/${caseId}/status`, { status }),
  getTimeline: (caseId) => api.get(`/cases/${caseId}/timeline`),
  signHearing: (caseId) => api.post(`/cases/${caseId}/sign-hearing`),
  getCommunications: (caseId) => api.get(`/cases/${caseId}/communications`),
  createCommunication: (caseId, data) => api.post(`/cases/${caseId}/communications`, data)
}

export const evidenceApi = {
  getList: (caseId) => api.get(`/evidences/${caseId}`),
  upload: (caseId, formData) => api.post(`/evidences/${caseId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: (caseId, evidenceId) => api.get(`/evidences/${caseId}/${evidenceId}/verify`)
}

export const documentApi = {
  getTemplates: () => api.get('/documents/templates'),
  fillTemplate: (templateId, variables) => api.post(`/documents/templates/${templateId}/fill`, variables),
  getList: (caseId) => api.get(`/documents/${caseId}`),
  create: (caseId, data) => api.post(`/documents/${caseId}`, data),
  getDetail: (caseId, documentId) => api.get(`/documents/${caseId}/${documentId}`),
  update: (caseId, documentId, content) => api.put(`/documents/${caseId}/${documentId}`, { content }),
  getVersions: (caseId, documentId) => api.get(`/documents/${caseId}/${documentId}/versions`),
  getDiff: (caseId, documentId, v1, v2) => api.get(`/documents/${caseId}/${documentId}/diff/${v1}/${v2}`)
}

export const accountingApi = {
  getTransactions: (caseId) => api.get(`/accounting/${caseId}/transactions`),
  createTransaction: (caseId, data) => api.post(`/accounting/${caseId}/transactions`, data),
  confirmTransaction: (transactionId) => api.put(`/accounting/transactions/${transactionId}/confirm`),
  getProfit: (caseId) => api.get(`/accounting/${caseId}/profit`),
  closeCase: (caseId) => api.post(`/accounting/${caseId}/close`),
  archiveCase: (caseId) => api.post(`/accounting/${caseId}/archive`),
  getReminders: (caseId) => api.get(`/accounting/${caseId}/reminders`)
}

export default api
