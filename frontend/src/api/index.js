import axios from 'axios'
import { useStore } from '@/store'

const { getSessionId, clearSession } = useStore()

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const sessionId = getSessionId()
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId
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
    console.error('API 错误:', error)
    
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/admin')) {
        clearSession()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export const homeApi = {
  getHomeData: () => api.get('/home'),
  getProfile: () => api.get('/profile')
}

export const articlesApi = {
  getList: (params) => api.get('/articles', { params }),
  getDetail: (id) => api.get(`/articles/${id}`)
}

export const albumsApi = {
  getList: (params) => api.get('/albums', { params }),
  getDetail: (id) => api.get(`/albums/${id}`)
}

export const mediaApi = {
  getList: (params) => api.get('/media', { params })
}

export const messagesApi = {
  getList: (params) => api.get('/messages', { params }),
  submit: (data) => api.post('/messages', data),
  delete: (id) => api.delete(`/messages/${id}`)
}

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword })
}

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getArticles: (params) => api.get('/admin/articles', { params }),
  createArticle: (data) => api.post('/admin/articles', data),
  updateArticle: (id, data) => api.put(`/admin/articles/${id}`, data),
  deleteArticle: (id) => api.delete(`/admin/articles/${id}`),
  getMessages: (params) => api.get('/admin/messages', { params }),
  approveMessage: (id) => api.put(`/admin/messages/${id}/approve`),
  replyMessage: (id, reply) => api.put(`/admin/messages/${id}/reply`, { reply }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  updateProfile: (data) => api.put('/admin/profile', data),
  getCategories: () => api.get('/admin/categories')
}

export default api
