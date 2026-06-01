import axios from 'axios'
import router from '../router'
import { useUserStore } from '../stores/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  let token = localStorage.getItem('token')
  try {
    const userStore = useUserStore()
    if (userStore.token) {
      token = userStore.token
    }
  } catch (e) {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      if (!url.includes('/auth/login')) {
        try {
          const userStore = useUserStore()
          userStore.logout()
        } catch (e) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        router.push({ path: '/login', query: { error: encodeURIComponent('登录已过期，请重新登录') } })
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

export const conversationApi = {
  list: (params) => api.get('/conversations', { params }),
  create: (data) => api.post('/conversations', data),
  pin: (id, data) => api.put(`/conversations/${id}/pin`, data),
  archive: (id, data) => api.put(`/conversations/${id}/archive`, data),
  block: (id, data) => api.put(`/conversations/${id}/block`, data),
  read: (id) => api.put(`/conversations/${id}/read`),
  messages: (id, params) => api.get(`/conversations/${id}/messages`, { params })
}

export const messageApi = {
  send: (data) => api.post('/messages', data),
  recall: (id) => api.put(`/messages/${id}/recall`),
  getStatus: (id) => api.get(`/messages/${id}/status`),
  delivered: (id) => api.put(`/messages/${id}/delivered`),
  read: (id) => api.put(`/messages/${id}/read`)
}

export const friendApi = {
  list: () => api.get('/friends'),
  request: (data) => api.post('/friends/request', data),
  accept: (id) => api.put(`/friends/${id}/accept`),
  delete: (id) => api.delete(`/friends/${id}`)
}

export const reportApi = {
  list: (params) => api.get('/reports', { params }),
  create: (data) => api.post('/reports', data),
  process: (id, data) => api.put(`/reports/${id}/process`, data)
}

export const punishmentApi = {
  list: (params) => api.get('/punishments', { params })
}

export const statisticsApi = {
  overview: () => api.get('/statistics/overview'),
  trend: (params) => api.get('/statistics/trend', { params }),
  csResponse: () => api.get('/statistics/cs-response')
}

export const userApi = {
  list: (params) => api.get('/users', { params }),
  search: (params) => api.get('/users/search', { params })
}

export const sensitiveWordApi = {
  list: () => api.get('/sensitive-words'),
  create: (data) => api.post('/sensitive-words', data),
  delete: (id) => api.delete(`/sensitive-words/${id}`)
}

export const auditLogApi = {
  list: (params) => api.get('/audit-logs', { params })
}

export const healthApi = {
  check: () => api.get('/health')
}

export default api
